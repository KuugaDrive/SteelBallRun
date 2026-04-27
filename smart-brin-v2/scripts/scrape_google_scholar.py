#!/usr/bin/env python
import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List

try:
    from scholarly import scholarly
except Exception as exc:
    sys.stderr.write(f"Package 'scholarly' tidak tersedia pada interpreter {sys.executable}: {exc}\n")
    sys.exit(1)


def _normalize_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip().lower()


def _contains_any(text: str, keywords: List[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _regex_hit(text: str, patterns: List[str]) -> bool:
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def _debug_log_issn(enabled: bool, message: str) -> None:
    if enabled:
        sys.stderr.write(f"[ISSN-DEBUG] {message}\n")


def extract_issn(bib: Dict[str, Any], debug: bool = False, title: str = "") -> str:
    """
    Extract a best-effort ISSN from common bib fields.
    Accepted forms: 1234-5678 or 12345678.
    """
    issn_pattern = r"\b(\d{4}-?\d{3}[\dxX])\b"
    candidates: List[tuple[str, str]] = []

    for key in ("issn", "ISSN", "citation", "journal", "booktitle", "publisher"):
        value = bib.get(key)
        if isinstance(value, str) and value.strip():
            candidates.append((key, value))

    for key, text in candidates:
        match = re.search(issn_pattern, text, flags=re.IGNORECASE)
        if not match:
            continue

        # Avoid false positives from DOI/page ranges (e.g. pp5231-5239).
        span_start = match.start(1)
        context_left = text[max(0, span_start - 15) : span_start].lower()
        if any(token in context_left for token in ("doi", "10.", "pp", "pages")):
            _debug_log_issn(debug, f"title='{title}' ignore candidate '{match.group(1)}' from field '{key}' (doi/pages context)")
            continue

        raw = match.group(1).upper().replace(" ", "")
        if "-" in raw:
            normalized = raw
        elif len(raw) == 8:
            normalized = f"{raw[:4]}-{raw[4:]}"
        else:
            normalized = raw

        if _is_valid_issn(normalized):
            _debug_log_issn(debug, f"title='{title}' ISSN from bib field '{key}': {normalized}")
            return normalized
        _debug_log_issn(debug, f"title='{title}' reject invalid ISSN candidate from field '{key}': {normalized}")

    _debug_log_issn(debug, f"title='{title}' no ISSN found in Scholar bib fields")
    return ""


def _is_valid_issn(value: str) -> bool:
    match = re.fullmatch(r"(\d{4})-(\d{3}[\dX])", value.upper())
    if not match:
        return False

    digits = (match.group(1) + match.group(2)).upper()
    total = 0
    for index, ch in enumerate(digits[:7]):
        total += int(ch) * (8 - index)

    check_value = (11 - (total % 11)) % 11
    expected = "X" if check_value == 10 else str(check_value)
    return digits[7] == expected


def _normalize_issn(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    value = value.strip().upper()
    match = re.search(r"\b(\d{4})-?(\d{3}[\dX])\b", value)
    if not match:
        return ""
    normalized = f"{match.group(1)}-{match.group(2)}"
    return normalized if _is_valid_issn(normalized) else ""


def _normalize_doi(value: Any) -> str:
    if not isinstance(value, str):
        return ""

    text = value.strip()
    if not text:
        return ""

    # Try a couple of URL-decode passes because some sources return encoded payloads.
    candidates = [text]
    decoded = text
    for _ in range(2):
        next_decoded = urllib.parse.unquote(decoded)
        if next_decoded == decoded:
            break
        candidates.append(next_decoded)
        decoded = next_decoded

    doi_pattern = re.compile(r"\b(10\.\d{4,9}/[-._;()/:A-Z0-9]+)\b", flags=re.IGNORECASE)
    match = None
    for candidate in candidates:
        match = doi_pattern.search(candidate)
        if match:
            break

    if not match:
        return ""

    doi = match.group(1).strip().rstrip(".,);]}>\"'")
    return doi.lower()


def extract_doi(bib: Dict[str, Any], pub_url: Any = None) -> str:
    candidates: List[str] = []

    for key in ("doi", "DOI", "citation", "journal", "booktitle", "url", "note", "abstract"):
        value = bib.get(key)
        if isinstance(value, str) and value.strip():
            candidates.append(value)

    if isinstance(pub_url, str) and pub_url.strip():
        decoded = urllib.parse.unquote(pub_url)
        candidates.extend([pub_url, decoded])

    for text in candidates:
        normalized = _normalize_doi(text)
        if normalized:
            return normalized

    return ""


def _fetch_json(url: str, timeout: int = 10) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "smart-brin-v1-scholar-scraper/1.0 (mailto:admin@example.com)",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        payload = response.read().decode("utf-8", errors="replace")
    return json.loads(payload)


def _fetch_doi_from_landing_page(url: str, debug: bool = False, title: str = "") -> str:
    if not isinstance(url, str) or not url.strip():
        return ""

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "smart-brin-v1-scholar-scraper/1.0 (mailto:admin@example.com)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            final_url = response.geturl()
            html = response.read().decode("utf-8", errors="replace")
    except Exception as exc:
        _debug_log_issn(debug, f"title='{title}' DOI landing page fetch failed for '{url}': {exc}")
        return ""

    # 1) Redirect URL itself (common when publisher redirects to doi.org)
    doi_from_url = _normalize_doi(final_url)
    if doi_from_url:
        _debug_log_issn(debug, f"title='{title}' DOI from landing final URL: {doi_from_url}")
        return doi_from_url

    # 2) DOI in common metadata tags
    meta_patterns = [
        r'<meta[^>]+name=["\']citation_doi["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']dc\.identifier["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']dc\.identifier\.doi["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']prism\.doi["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+property=["\']prism\.doi["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pattern in meta_patterns:
        for m in re.finditer(pattern, html, flags=re.IGNORECASE):
            doi = _normalize_doi(m.group(1))
            if doi:
                _debug_log_issn(debug, f"title='{title}' DOI from landing meta: {doi}")
                return doi

    # 3) DOI in page text
    doi_in_html = _normalize_doi(html)
    if doi_in_html:
        _debug_log_issn(debug, f"title='{title}' DOI from landing page text: {doi_in_html}")
        return doi_in_html

    _debug_log_issn(debug, f"title='{title}' DOI not found on landing page")
    return ""


def _extract_valid_issn_from_text(text: str) -> str:
    if not isinstance(text, str) or not text.strip():
        return ""
    for match in re.finditer(r"\b(\d{4}-?\d{3}[\dXx])\b", text):
        raw = match.group(1).upper().replace(" ", "")
        normalized = raw if "-" in raw else f"{raw[:4]}-{raw[4:]}"
        if _is_valid_issn(normalized):
            return normalized
    return ""


def _fetch_issn_from_doi_landing_page(doi: str, debug: bool = False, title: str = "") -> str:
    if not doi:
        return ""
    landing_url = f"https://doi.org/{doi}"
    req = urllib.request.Request(
        landing_url,
        headers={
            "User-Agent": "smart-brin-v1-scholar-scraper/1.0 (mailto:admin@example.com)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            html = response.read().decode("utf-8", errors="replace")
    except Exception as exc:
        _debug_log_issn(debug, f"title='{title}' DOI landing page fetch failed for '{doi}': {exc}")
        return ""

    # Prefer explicit ISSN-related meta tags.
    meta_patterns = [
        r'<meta[^>]+name=["\']citation_issn["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']eissn["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']issn["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']prism\.issn["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+property=["\']prism\.issn["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pattern in meta_patterns:
        for m in re.finditer(pattern, html, flags=re.IGNORECASE):
            candidate = _extract_valid_issn_from_text(m.group(1))
            if candidate:
                _debug_log_issn(debug, f"title='{title}' ISSN from DOI landing meta '{doi}': {candidate}")
                return candidate

    # Fallback to ISSN labels in page text.
    label_hit = re.search(r"(?:e-?issn|p-?issn|issn)\s*[:#]?\s*([0-9]{4}-?[0-9]{3}[\dXx])", html, flags=re.IGNORECASE)
    if label_hit:
        candidate = _extract_valid_issn_from_text(label_hit.group(1))
        if candidate:
            _debug_log_issn(debug, f"title='{title}' ISSN from DOI landing label '{doi}': {candidate}")
            return candidate

    _debug_log_issn(debug, f"title='{title}' no ISSN found on DOI landing page for '{doi}'")
    return ""


def _pick_preferred_crossref_issn(message: Dict[str, Any], debug: bool = False, title: str = "", doi: str = "") -> str:
    # Prefer electronic ISSN when available, then fall back to any valid ISSN.
    issn_type = message.get("issn-type", [])
    if isinstance(issn_type, list):
        for item in issn_type:
            if not isinstance(item, dict):
                continue
            if str(item.get("type", "")).lower() != "electronic":
                continue
            normalized = _normalize_issn(item.get("value"))
            if normalized:
                _debug_log_issn(debug, f"title='{title}' ISSN from Crossref e-ISSN DOI '{doi}': {normalized}")
                return normalized

    issn_list = message.get("ISSN", [])
    if isinstance(issn_list, list):
        for item in issn_list:
            normalized = _normalize_issn(item)
            if normalized:
                _debug_log_issn(debug, f"title='{title}' ISSN from Crossref DOI '{doi}': {normalized}")
                return normalized

    return ""


def fetch_issn_by_doi(doi: str, debug: bool = False, title: str = "") -> str:
    if not doi:
        _debug_log_issn(debug, f"title='{title}' DOI empty, skip ISSN lookup")
        return ""

    # 1) Crossref by DOI
    crossref_urls = [
        f"https://api.crossref.org/works/{urllib.parse.quote(doi, safe='')}",
        f"https://api.crossref.org/works/{doi}",
    ]
    for crossref_url in crossref_urls:
        try:
            crossref_data = _fetch_json(crossref_url)
            message = crossref_data.get("message", {}) if isinstance(crossref_data, dict) else {}
            if isinstance(message, dict):
                preferred = _pick_preferred_crossref_issn(message, debug=debug, title=title, doi=doi)
                if preferred:
                    return preferred
        except Exception as exc:
            _debug_log_issn(debug, f"title='{title}' Crossref lookup failed for DOI '{doi}' via '{crossref_url}': {exc}")

    # 2) OpenAlex by DOI
    openalex_url = f"https://api.openalex.org/works/https://doi.org/{urllib.parse.quote(doi, safe='')}"
    try:
        openalex_data = _fetch_json(openalex_url)
        primary_location = openalex_data.get("primary_location", {}) if isinstance(openalex_data, dict) else {}
        source = primary_location.get("source", {}) if isinstance(primary_location, dict) else {}
        issn_list = source.get("issn_l") or source.get("issn")

        if isinstance(issn_list, str):
            normalized = _normalize_issn(issn_list)
            if normalized:
                _debug_log_issn(debug, f"title='{title}' ISSN from OpenAlex DOI '{doi}': {normalized}")
                return normalized
        elif isinstance(issn_list, list):
            for item in issn_list:
                normalized = _normalize_issn(item)
                if normalized:
                    _debug_log_issn(debug, f"title='{title}' ISSN from OpenAlex DOI '{doi}': {normalized}")
                    return normalized
    except Exception as exc:
        _debug_log_issn(debug, f"title='{title}' OpenAlex lookup failed for DOI '{doi}': {exc}")

    landing_issn = _fetch_issn_from_doi_landing_page(doi, debug=debug, title=title)
    if landing_issn:
        return landing_issn

    _debug_log_issn(debug, f"title='{title}' no ISSN resolved from DOI '{doi}'")
    return ""


def _normalize_title_for_match(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def fetch_issn_by_title(title: str, pub_year: Any = None, debug: bool = False) -> str:
    if not isinstance(title, str) or not title.strip():
        return ""

    normalized_target = _normalize_title_for_match(title)
    query_url = (
        "https://api.crossref.org/works"
        f"?query.title={urllib.parse.quote(title)}"
        "&rows=5"
    )
    try:
        data = _fetch_json(query_url)
        message = data.get("message", {}) if isinstance(data, dict) else {}
        items = message.get("items", []) if isinstance(message, dict) else []
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue

                candidate_title_raw = ""
                candidate_titles = item.get("title", [])
                if isinstance(candidate_titles, list) and candidate_titles and isinstance(candidate_titles[0], str):
                    candidate_title_raw = candidate_titles[0]

                candidate_normalized = _normalize_title_for_match(candidate_title_raw)
                if not candidate_normalized:
                    continue

                # Only accept exact normalized title to avoid wrong journal mapping.
                if candidate_normalized != normalized_target:
                    continue

                # If target year provided, prefer same year when available.
                if pub_year is not None:
                    year_candidates = []
                    for date_key in ("published-online", "published-print", "issued"):
                        date_part = item.get(date_key, {})
                        if isinstance(date_part, dict):
                            dp = date_part.get("date-parts", [])
                            if isinstance(dp, list) and dp and isinstance(dp[0], list) and dp[0]:
                                first = dp[0][0]
                                if isinstance(first, int):
                                    year_candidates.append(first)
                    if year_candidates and int(pub_year) not in year_candidates:
                        continue

                preferred = _pick_preferred_crossref_issn(item, debug=debug, title=title, doi=str(item.get("DOI", "")))
                if preferred:
                    _debug_log_issn(debug, f"title='{title}' ISSN from title-based Crossref lookup: {preferred}")
                    return preferred
    except Exception as exc:
        _debug_log_issn(debug, f"title='{title}' Crossref title lookup failed: {exc}")

    _debug_log_issn(debug, f"title='{title}' no ISSN resolved from title-based lookup")
    return ""


def fetch_doi_by_title(title: str, pub_year: Any = None, debug: bool = False) -> str:
    if not isinstance(title, str) or not title.strip():
        return ""

    normalized_target = _normalize_title_for_match(title)
    query_url = (
        "https://api.crossref.org/works"
        f"?query.title={urllib.parse.quote(title)}"
        "&rows=5"
    )
    try:
        data = _fetch_json(query_url)
        message = data.get("message", {}) if isinstance(data, dict) else {}
        items = message.get("items", []) if isinstance(message, dict) else []
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue

                candidate_title_raw = ""
                candidate_titles = item.get("title", [])
                if isinstance(candidate_titles, list) and candidate_titles and isinstance(candidate_titles[0], str):
                    candidate_title_raw = candidate_titles[0]

                candidate_normalized = _normalize_title_for_match(candidate_title_raw)
                if not candidate_normalized or candidate_normalized != normalized_target:
                    continue

                if pub_year is not None:
                    year_candidates = []
                    for date_key in ("published-online", "published-print", "issued"):
                        date_part = item.get(date_key, {})
                        if isinstance(date_part, dict):
                            dp = date_part.get("date-parts", [])
                            if isinstance(dp, list) and dp and isinstance(dp[0], list) and dp[0]:
                                first = dp[0][0]
                                if isinstance(first, int):
                                    year_candidates.append(first)
                    if year_candidates and int(pub_year) not in year_candidates:
                        continue

                doi = _normalize_doi(str(item.get("DOI", "")))
                if doi:
                    _debug_log_issn(debug, f"title='{title}' DOI from title-based Crossref lookup: {doi}")
                    return doi
    except Exception as exc:
        _debug_log_issn(debug, f"title='{title}' Crossref DOI title lookup failed: {exc}")

    _debug_log_issn(debug, f"title='{title}' no DOI resolved from title-based lookup")
    return ""


def extract_venue_title(bib: Dict[str, Any]) -> str:
    """
    Venue title priority:
    Journal > Conference > Book title > Venue > Publisher.
    """
    for key in ("journal", "conference", "booktitle", "venue", "publisher"):
        value = bib.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def detect_publication_type(bib: Dict[str, Any], pub_url: Any = None) -> str:
    # Keep classification conservative: prefer Journal Article when uncertain.
    entry_type = _normalize_text(bib.get("ENTRYTYPE"))
    if entry_type in {"article"}:
        return "Journal Article"
    if entry_type in {"inproceedings", "proceedings"}:
        return "Conference Paper"
    if entry_type in {"incollection", "inbook"}:
        return "Book Chapter"
    if entry_type in {"book"}:
        return "Book"
    if entry_type in {"phdthesis", "mastersthesis", "thesis"}:
        return "Thesis/Dissertation"
    if entry_type in {"techreport", "report"}:
        return "Report"

    title = _normalize_text(bib.get("title"))
    journal = _normalize_text(bib.get("journal"))
    conference = _normalize_text(bib.get("conference"))
    booktitle = _normalize_text(bib.get("booktitle"))
    publisher = _normalize_text(bib.get("publisher"))
    citation = _normalize_text(bib.get("citation"))
    venue = _normalize_text(bib.get("venue"))
    school = _normalize_text(bib.get("school"))
    institution = _normalize_text(bib.get("institution"))
    url = _normalize_text(pub_url)

    venue_blob = " ".join([title, journal, conference, booktitle, publisher, citation, venue, school, institution, url]).strip()

    if journal:
        return "Journal Article"

    if _contains_any(venue_blob, ["thesis", "dissertation", "skripsi", "tesis", "disertasi"]):
        return "Thesis/Dissertation"
    if _contains_any(venue_blob, ["arxiv", "preprint", "biorxiv", "medrxiv", "ssrn"]):
        return "Preprint"
    if _contains_any(venue_blob, ["technical report", "working paper", "research report", "white paper", "policy brief"]):
        return "Report"

    conference_keywords = [
        "proceeding",
        "conference",
        "symposium",
        "workshop",
        "congress",
        "seminar",
        "ieee",
        "acm",
    ]
    if conference or _contains_any(venue_blob, conference_keywords):
        return "Conference Paper"

    chapter_keywords = ["chapter", "book chapter", "in:", "handbook", "encyclopedia"]
    if booktitle and _contains_any(venue_blob, chapter_keywords):
        return "Book Chapter"

    # Guard rails against false Book labels:
    # do not call it Book when journal-like signals exist.
    journal_regex = [r"\bvol\.?\s*\d+\b", r"\bno\.?\s*\d+\b", r"\bissue\s*\d+\b", r"\bissn\b"]
    has_journal_signal = _regex_hit(venue_blob, journal_regex) or _contains_any(
        venue_blob,
        ["journal", "jurnal", "letters", "review", "transactions"],
    )
    if has_journal_signal:
        return "Journal Article"

    # Only classify as Book with strong book signals.
    strong_book_keywords = ["isbn", "edition", "hardcover", "paperback", "monograph", "edited by"]
    weak_book_keywords = ["book", "press", "springer", "routledge", "wiley", "cambridge", "oxford"]
    has_strong_book_signal = _contains_any(venue_blob, strong_book_keywords)
    weak_book_signal_count = sum(1 for token in weak_book_keywords if token in venue_blob)
    if (has_strong_book_signal or weak_book_signal_count >= 2) and not has_journal_signal and not conference:
        return "Book"

    return "Journal Article"


def _legacy_detect_publication_type_fallback(bib: Dict[str, Any], pub_url: Any = None) -> str:
    """Legacy fallback retained for emergency compatibility."""
    journal = _normalize_text(bib.get("journal"))
    conference = _normalize_text(bib.get("conference"))
    booktitle = _normalize_text(bib.get("booktitle"))
    publisher = _normalize_text(bib.get("publisher"))
    citation = _normalize_text(bib.get("citation"))
    url = _normalize_text(pub_url)
    venue_blob = " ".join([journal, conference, booktitle, citation, url]).strip()

    if journal:
        return "Journal Article"

    conference_keywords = ["proceeding", "conference", "symposium", "workshop", "congress", "seminar"]
    if conference or any(keyword in venue_blob for keyword in conference_keywords):
        return "Conference Paper"

    book_chapter_keywords = ["chapter", "in:", "handbook", "encyclopedia"]
    if booktitle and any(keyword in venue_blob for keyword in book_chapter_keywords):
        return "Book Chapter"

    book_keywords = [
        "isbn",
        "edition",
        "hardcover",
        "paperback",
        "monograph",
        "book",
    ]
    has_book_signal = any(keyword in venue_blob for keyword in book_keywords)
    if publisher and has_book_signal and not journal and not conference:
        return "Book"

    return "Journal Article"


def normalize_authors(raw_authors: Any) -> List[str]:
    if isinstance(raw_authors, list):
        return [str(author).strip() for author in raw_authors if str(author).strip()]

    if isinstance(raw_authors, str):
        return [author.strip() for author in raw_authors.split(" and ") if author.strip()]

    return []


def detect_author_position(authors_list: List[str], author_name: str) -> Dict[str, Any]:
    author_name_lower = author_name.lower().strip()
    author_order = None
    author_role = "Co-Author"

    for index, current_name in enumerate(authors_list):
        if author_name_lower in current_name.lower():
            author_order = index + 1
            if index == 0:
                author_role = "First Author"
            break

    return {"author_order": author_order, "author_role": author_role}


def scrape_publications(author_name: str, scholar_id: str, target_year: int, debug_issn: bool = False) -> List[Dict[str, Any]]:
    author = scholarly.search_author_id(scholar_id)
    author = scholarly.fill(author, sections=["publications"])
    publications = author.get("publications", [])

    rows: List[Dict[str, Any]] = []
    doi_issn_cache: Dict[str, str] = {}
    landing_url_doi_cache: Dict[str, str] = {}
    title_year_doi_cache: Dict[str, str] = {}
    title_year_issn_cache: Dict[str, str] = {}
    for pub in publications:
        pub_year = pub.get("bib", {}).get("pub_year")
        if not str(pub_year).isdigit() or int(pub_year) != target_year:
            continue

        filled_pub = scholarly.fill(pub)
        bib = filled_pub.get("bib", {})
        raw_authors = bib.get("author", "")
        authors_list = normalize_authors(raw_authors)
        author_pos = detect_author_position(authors_list, author_name)

        pub_url = filled_pub.get("pub_url") or filled_pub.get("eprint_url")
        raw_title = str(bib.get("title") or "")
        doi = extract_doi(bib, pub_url)
        if not doi and isinstance(pub_url, str) and pub_url.strip():
            if pub_url not in landing_url_doi_cache:
                landing_url_doi_cache[pub_url] = _fetch_doi_from_landing_page(pub_url, debug=debug_issn, title=raw_title)
                time.sleep(0.3)
            doi = landing_url_doi_cache.get(pub_url, "")

        if not doi:
            doi_cache_key = f"{raw_title.lower().strip()}::{pub_year}"
            if doi_cache_key not in title_year_doi_cache:
                title_year_doi_cache[doi_cache_key] = fetch_doi_by_title(raw_title, pub_year, debug=debug_issn)
                time.sleep(0.3)
            doi = title_year_doi_cache.get(doi_cache_key, "")

        issn = extract_issn(bib, debug=debug_issn, title=raw_title)
        if not issn:
            if doi:
                if doi not in doi_issn_cache:
                    _debug_log_issn(debug_issn, f"title='{raw_title}' trying DOI fallback: {doi}")
                    doi_issn_cache[doi] = fetch_issn_by_doi(doi, debug=debug_issn, title=raw_title)
                    time.sleep(0.3)
                else:
                    _debug_log_issn(debug_issn, f"title='{raw_title}' use cached DOI ISSN for {doi}: {doi_issn_cache[doi] or 'EMPTY'}")
                issn = doi_issn_cache.get(doi, "")
            else:
                _debug_log_issn(debug_issn, f"title='{raw_title}' DOI not found, cannot do ISSN fallback")
                cache_key = f"{raw_title.lower().strip()}::{pub_year}"
                if cache_key not in title_year_issn_cache:
                    title_year_issn_cache[cache_key] = fetch_issn_by_title(raw_title, pub_year, debug=debug_issn)
                    time.sleep(0.3)
                else:
                    _debug_log_issn(
                        debug_issn,
                        f"title='{raw_title}' use cached title-based ISSN for year {pub_year}: {title_year_issn_cache[cache_key] or 'EMPTY'}",
                    )
                issn = title_year_issn_cache.get(cache_key, "")

        rows.append(
            {
                "raw_title": bib.get("title"),
                "title": extract_venue_title(bib) or None,
                "raw_authors": ", ".join(authors_list) if authors_list else (raw_authors if isinstance(raw_authors, str) else None),
                "raw_author_list": authors_list,
                "pub_type": detect_publication_type(bib, pub_url),
                "publication_year": int(pub_year),
                "publisher": bib.get("journal") or bib.get("conference") or bib.get("booktitle") or bib.get("publisher"),
                "doi": doi or None,
                "issn": issn or None,
                "scholar_link": pub_url,
                "author_role": author_pos["author_role"],
                "author_order": author_pos["author_order"],
                "ai_abstract": bib.get("abstract"),
                "ai_core_focus": None,
                "ai_metadata": bib,
            }
        )

        time.sleep(0.7)

    return rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape publication metadata from Google Scholar.")
    parser.add_argument("--author-name", required=True)
    parser.add_argument("--scholar-id", required=True)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--debug-issn", action="store_true", help="Log ISSN extraction trace to stderr.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = scrape_publications(args.author_name, args.scholar_id, args.year, debug_issn=args.debug_issn)
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:
        sys.stderr.write(f"Scraping gagal: {exc}\n")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
