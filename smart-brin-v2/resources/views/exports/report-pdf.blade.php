<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Laporan Capaian {{ $period }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        h1 {
            color: #E62F2A;
            text-align: center;
            margin-bottom: 5px;
            font-size: 24px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
            font-size: 16px;
        }
        .header-img {
            text-align: center;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 12px;
        }
        th {
            background-color: #f2f2f2;
            text-align: left;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .progress-container {
            background-color: #f2f2f2;
            height: 10px;
            border-radius: 5px;
            width: 100%;
        }
        .progress-bar {
            height: 10px;
            border-radius: 5px;
        }
        .green {
            background-color: #4CAF50;
        }
        .yellow {
            background-color: #FFD700;
        }
        .red {
            background-color: #FF6347;
        }
        .percentage {
            margin-bottom: 5px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
        }
        .badge-success {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        .badge-warning {
            background-color: #fff8e1;
            color: #f9a825;
        }
        .badge-danger {
            background-color: #ffebee;
            color: #c62828;
        }
    </style>
</head>
<body>
    <h1>Laporan Capaian PRSDI</h1>
    <div class="subtitle">Periode: {{ $period }}</div>

    <table>
        <thead>
            <tr>
                <th>Indikator</th>
                <th>Target</th>
                <th>Capaian</th>
                <th>Persentase</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($indicators as $key => $label)
                @php
                    $targetValue = $target[$key] ?? 0;
                    $achievedValue = $capaian[$key] ?? 0;
                    $percentage = $targetValue > 0 ? min(100, round(($achievedValue / $targetValue) * 100)) : 0;
                    
                    $statusClass = $percentage >= 100 ? 'success' : ($percentage >= 75 ? 'warning' : 'danger');
                    $statusText = $percentage >= 100 ? 'Tercapai' : ($percentage >= 75 ? 'Hampir Tercapai' : 'Belum Tercapai');
                    $barColor = $percentage >= 100 ? 'green' : ($percentage >= 75 ? 'yellow' : 'red');
                @endphp
                <tr>
                    <td>{{ $label }}</td>
                    <td align="right">
                        @if($key === 'dana_eksternal')
                            Rp{{ number_format($targetValue, 0, ',', '.') }}
                        @else
                            {{ $targetValue }}
                        @endif
                    </td>
                    <td align="right">
                        @if($key === 'dana_eksternal')
                            Rp{{ number_format($achievedValue, 0, ',', '.') }}
                        @else
                            {{ $achievedValue }}
                        @endif
                    </td>
                    <td>
                        <div class="percentage">{{ $percentage }}%</div>
                        <div class="progress-container">
                            <div class="progress-bar {{ $barColor }}" style="width: {{ $percentage }}%"></div>
                        </div>
                    </td>
                    <td align="center">
                        <span class="badge badge-{{ $statusClass }}">{{ $statusText }}</span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Laporan ini dibuat otomatis oleh Sistem SMART PRSDI BRIN pada {{ date('d F Y, H:i') }}</p>
        <p>© Pusat Riset Sains Data dan Intelijen Bisnis - BRIN</p>
    </div>
</body>
</html>
