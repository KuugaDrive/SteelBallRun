<?php

namespace App\Services;

class PublicationTypeClassifierService
{
    public function classify(?array $bib, ?string $pubUrl = null, ?string $fallbackPubType = null, ?string $fallbackPublisher = null): string
    {
        $bib = is_array($bib) ? $bib : [];

        $entryType = $this->normalize($bib['ENTRYTYPE'] ?? null);
        if ($entryType === 'article') {
            return 'Journal Article';
        }
        if ($entryType === 'inproceedings') {
            return 'Conference Paper';
        }
        if (in_array($entryType, ['incollection', 'inbook'], true)) {
            return 'Book Chapter';
        }
        if ($entryType === 'book') {
            return 'Book';
        }

        $journal = $this->normalize($bib['journal'] ?? null);
        $conference = $this->normalize($bib['conference'] ?? null);
        $booktitle = $this->normalize($bib['booktitle'] ?? null);
        $citation = $this->normalize($bib['citation'] ?? null);
        $publisher = $this->normalize($bib['publisher'] ?? $fallbackPublisher);
        $url = $this->normalize($pubUrl);

        $venueBlob = trim(implode(' ', array_filter([$journal, $conference, $booktitle, $citation, $url])));

        if ($journal !== '') {
            return 'Journal Article';
        }

        $conferenceKeywords = ['proceeding', 'conference', 'symposium', 'workshop', 'congress', 'seminar'];
        if ($conference !== '' || $this->containsAny($venueBlob, $conferenceKeywords)) {
            return 'Conference Paper';
        }

        $bookChapterKeywords = ['chapter', 'in:', 'handbook', 'encyclopedia'];
        if ($booktitle !== '' && $this->containsAny($venueBlob, $bookChapterKeywords)) {
            return 'Book Chapter';
        }

        $bookKeywords = ['isbn', 'edition', 'hardcover', 'paperback', 'monograph', 'book'];
        if ($publisher !== '' && $this->containsAny($venueBlob, $bookKeywords) && $journal === '' && $conference === '') {
            return 'Book';
        }

        $fallback = $this->normalize($fallbackPubType);
        if ($fallback !== '') {
            return ucwords($fallback);
        }

        return 'Journal Article';
    }

    private function normalize(mixed $value): string
    {
        if (!is_string($value)) {
            return '';
        }

        return trim(mb_strtolower($value));
    }

    /**
     * @param array<int, string> $keywords
     */
    private function containsAny(string $text, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            if ($keyword !== '' && str_contains($text, $keyword)) {
                return true;
            }
        }

        return false;
    }
}

