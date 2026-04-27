<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Capaian</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #E62F2A;
            margin-bottom: 5px;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #E62F2A;
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            border: 1px solid #ddd;
        }
        td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: right;
        }
        .status-success {
            color: #10b981;
        }
        .status-warning {
            color: #f59e0b;
        }
        .status-danger {
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">LAPORAN CAPAIAN</div>
            <div class="subtitle">Periode: {{ str_replace('_', ' ', $period) }}</div>
        </div>
        
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
                @foreach($rows as $row)
                <tr>
                    <td>{{ $row[0] }}</td>
                    <td class="text-right">{{ $row[1] }}</td>
                    <td class="text-right">{{ $row[2] }}</td>
                    <td class="text-right">{{ $row[3] }}</td>
                    <td class="text-center">
                        @php
                            $percentage = (int) str_replace('%', '', $row[3]);
                            $statusClass = $percentage >= 100 ? 'status-success' : 
                                          ($percentage >= 75 ? 'status-warning' : 'status-danger');
                        @endphp
                        <span class="{{ $statusClass }}">{{ $row[4] }}</span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        
        <div class="footer">
            Laporan ini diekspor pada {{ $date }}
        </div>
    </div>
</body>
</html>
