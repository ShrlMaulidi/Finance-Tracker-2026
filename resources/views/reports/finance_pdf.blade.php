@php
    function formatRupiah($num, $showPlus = false) {
        if ($num < 0) {
            return '-Rp ' . number_format(abs($num), 0, ',', '.');
        } elseif ($showPlus && $num > 0) {
            return '+Rp ' . number_format($num, 0, ',', '.');
        } else {
            return 'Rp ' . number_format($num, 0, ',', '.');
        }
    }
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Laporan Keuangan - {{ $periodLabel }}</title>
    <style>
        @page {
            margin: 10mm 12mm 13mm 12mm;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 9px;
            color: #1e293b;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }

        /* Top Header */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        .brand-logo {
            font-size: 19px;
            font-weight: 800;
            color: #009bd2;
            letter-spacing: -0.5px;
            margin: 0;
            line-height: 1.1;
        }
        .brand-tagline {
            font-size: 8.5px;
            color: #64748b;
            font-weight: 500;
            margin-top: 2px;
        }
        .report-meta {
            text-align: right;
            font-size: 8.5px;
            color: #475569;
            line-height: 1.35;
        }
        .report-meta strong {
            color: #0f172a;
        }
        .accent-divider {
            height: 2px;
            background-color: #009bd2;
            width: 100%;
            margin-bottom: 8px;
        }

        /* Period Banner Card */
        .period-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 6px 10px;
            margin-bottom: 8px;
        }
        .period-table {
            width: 100%;
            border-collapse: collapse;
        }
        .period-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
        }
        .period-val {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 1px;
        }
        .period-stat {
            text-align: right;
            font-size: 9px;
            color: #334155;
        }

        /* Section Headings */
        .section-title {
            font-size: 9.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-top: 8px;
            margin-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2px;
        }

        /* Executive 4 Cards Summary */
        .summary-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 5px 0;
            margin-left: -5px;
            margin-right: -5px;
            margin-bottom: 8px;
        }
        .sum-box {
            border-radius: 5px;
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            background-color: #ffffff;
        }
        .sum-box-in {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
            border-left: 3px solid #10b981;
        }
        .sum-box-out {
            background-color: #fff1f2;
            border-color: #fecdd3;
            border-left: 3px solid #f43f5e;
        }
        .sum-box-net {
            background-color: #f0f9ff;
            border-color: #bae6fd;
            border-left: 3px solid #009bd2;
        }
        .sum-box-bal {
            background-color: #f5f3ff;
            border-color: #ddd6fe;
            border-left: 3px solid #8b5cf6;
        }
        .sum-label {
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.3px;
        }
        .sum-amount {
            font-size: 11.5px;
            font-weight: 800;
            margin-top: 1px;
        }
        .text-in { color: #059669; }
        .text-out { color: #e11d48; }
        .text-net { color: #0284c7; }
        .text-bal { color: #7c3aed; }

        /* Secondary Balances Table */
        .sub-tables {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .sub-table-col {
            vertical-align: top;
            width: 50%;
        }
        .bordered-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
        }
        .bordered-table th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 4px 6px;
            border: 1px solid #1e293b;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .bordered-table td {
            padding: 4px 6px;
            border: 1px solid #e2e8f0;
            color: #334155;
        }
        .bordered-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        /* Transactions Main Table */
        .trx-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
        }
        .trx-table thead {
            display: table-header-group;
        }
        .trx-table tfoot {
            display: table-row-group;
            page-break-inside: avoid;
        }
        .trx-table tr {
            page-break-inside: avoid;
        }
        .trx-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            padding: 5px 6px;
            border: 1px solid #0f172a;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .trx-table td {
            padding: 4px 6px;
            border: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
        }
        .trx-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        /* Badges */
        .badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.2px;
        }
        .badge-in {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .badge-out {
            background-color: #ffe4e6;
            color: #9f1239;
            border: 1px solid #fecdd3;
        }
        .badge-tab {
            background-color: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
        }

        /* Alignments & Utilities */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .font-extrabold { font-weight: 800; }

        /* Total Footer Rows */
        .total-row td {
            background-color: #f1f5f9;
            font-weight: 700;
            color: #0f172a;
            border-top: 1px solid #cbd5e1;
            padding: 4px 6px;
            font-size: 8.5px;
        }
        .total-row-highlight td {
            background-color: #f8fafc;
            border-top: 1px dashed #cbd5e1;
            border-bottom: 2px solid #0f172a;
            padding: 5px 6px;
            font-size: 9px;
        }

        /* Document Footer */
        .doc-footer {
            position: fixed;
            bottom: -9mm;
            left: 0;
            right: 0;
            border-top: 1px solid #e2e8f0;
            padding-top: 3px;
        }
    </style>
</head>
<body>

    <!-- Native Page Numbers via DomPDF PHP script -->
    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->getFont("DejaVu Sans", "normal");
            $pdf->page_text(485, 822, "Halaman {PAGE_NUM} dari {PAGE_COUNT}", $font, 7.5, array(0.58, 0.64, 0.72));
        }
    </script>

    <!-- Fixed Footer -->
    <div class="doc-footer">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="text-align: left; font-size: 7.5px; color: #94a3b8; border: none; padding: 0;">
                    FinanceTrack &bull; Dokumen resmi ini digenerate secara otomatis pada {{ $generatedAt }}
                </td>
                <td style="text-align: right; font-size: 7.5px; color: #94a3b8; border: none; padding: 0; width: 110px;">
                    <!-- Spasi untuk script page_text DomPDF -->
                </td>
            </tr>
        </table>
    </div>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 52%; vertical-align: middle;">
                <div class="brand-logo">FinanceTrack</div>
                <div class="brand-tagline">Laporan Keuangan Pribadi & Pengelolaan Finansial</div>
            </td>
            <td style="width: 48%; vertical-align: middle;" class="report-meta">
                <div>Nama Akun: <strong>{{ $user->name }}</strong></div>
                <div>Email: {{ $user->email }}</div>
                <div>Waktu Cetak: {{ $generatedAt }}</div>
            </td>
        </tr>
    </table>

    <div class="accent-divider"></div>

    <!-- Period Info Banner -->
    <div class="period-card">
        <table class="period-table">
            <tr>
                <td style="vertical-align: middle;">
                    <div class="period-label">Periode Laporan</div>
                    <div class="period-val">{{ $periodLabel }}</div>
                </td>
                <td class="period-stat" style="vertical-align: middle;">
                    <div>Total Transaksi Tercatat: <strong style="color: #0f172a; font-size: 11px;">{{ count($transactions) }}</strong> catatan</div>
                    <div style="color: #64748b; font-size: 8.5px; margin-top: 2px;">Status Dokumen: <span style="color: #059669; font-weight: bold;">Terverifikasi</span></div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Executive Summary 4-Cards Grid -->
    <div class="section-title">Ringkasan Arus Kas ({{ $periodLabel }})</div>
    <table class="summary-grid">
        <tr>
            <td style="width: 25%;">
                <div class="sum-box sum-box-in">
                    <div class="sum-label">Total Pemasukan</div>
                    <div class="sum-amount text-in">{{ formatRupiah($summary['pemasukan']) }}</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="sum-box sum-box-out">
                    <div class="sum-label">Total Pengeluaran</div>
                    <div class="sum-amount text-out">{{ formatRupiah($summary['pengeluaran']) }}</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="sum-box sum-box-net">
                    <div class="sum-label">Arus Kas Bersih (Net)</div>
                    <div class="sum-amount text-net">{{ formatRupiah($summary['net'], true) }}</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="sum-box sum-box-bal">
                    <div class="sum-label">Sisa Saldo Aktif</div>
                    <div class="sum-amount text-bal">{{ formatRupiah($summary['saldo_aktif']) }}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Secondary Breakdown: Metode & Kewajiban -->
    <table class="sub-tables">
        <tr>
            <td class="sub-table-col" style="padding-right: 5px;">
                <div class="section-title" style="margin-top: 4px;">Sisa Saldo Berdasarkan Metode</div>
                <table class="bordered-table" style="margin-top: 4px;">
                    <thead>
                        <tr>
                            <th>Metode Pembayaran</th>
                            <th class="text-right">Sisa Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($summary['saldo_by_method'] as $method => $amount)
                            <tr>
                                <td class="font-bold">{{ $method }}</td>
                                <td class="text-right font-bold {{ $amount < 0 ? 'text-out' : 'text-in' }}">
                                    {{ formatRupiah($amount) }}
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="2" class="text-center" style="color: #94a3b8; padding: 10px;">Belum ada catatan metode pembayaran.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </td>
            <td class="sub-table-col" style="padding-left: 5px;">
                <div class="section-title" style="margin-top: 4px;">Kewajiban & Tabungan (All-Time)</div>
                <table class="bordered-table" style="margin-top: 4px;">
                    <thead>
                        <tr>
                            <th>Keterangan Modul</th>
                            <th class="text-right">Total Akumulasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Total Hutang (Belum Lunas)</td>
                            <td class="text-right font-bold text-out">{{ formatRupiah($summary['hutang']) }}</td>
                        </tr>
                        <tr>
                            <td>Total Piutang (Belum Lunas)</td>
                            <td class="text-right font-bold text-in">{{ formatRupiah($summary['piutang']) }}</td>
                        </tr>
                        <tr>
                            <td>Total Tabungan & Target</td>
                            <td class="text-right font-bold text-net">{{ formatRupiah($summary['tabungan']) }}</td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    <!-- Rincian Transaksi Table -->
    <div class="section-title">Rincian Transaksi ({{ $periodLabel }})</div>
    <table class="trx-table">
        <thead>
            <tr>
                <th style="width: 4%;" class="text-center">No</th>
                <th style="width: 13%;">Tanggal</th>
                <th style="width: 27%;">Keterangan</th>
                <th style="width: 15%;">Kategori</th>
                <th style="width: 14%;">Metode</th>
                <th style="width: 12%;" class="text-center">Tipe</th>
                <th style="width: 15%;" class="text-right">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $index => $trx)
                <tr>
                    <td class="text-center" style="color: #64748b;">{{ $index + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($trx->date)->translatedFormat('d M Y') }}</td>
                    <td>
                        <strong style="color: #0f172a;">{{ $trx->title ?? '-' }}</strong>
                        @if($trx->description)
                            <div style="font-size: 8px; color: #64748b; margin-top: 1px;">{{ $trx->description }}</div>
                        @endif
                    </td>
                    <td>{{ $trx->category ?? '-' }}</td>
                    <td>{{ $trx->payment_method ?? '-' }}</td>
                    <td class="text-center">
                        @if($trx->type === 'pemasukan')
                            <span class="badge badge-in">Pemasukan</span>
                        @elseif($trx->type === 'pengeluaran')
                            <span class="badge badge-out">Pengeluaran</span>
                        @else
                            <span class="badge badge-tab">Tabungan</span>
                        @endif
                    </td>
                    <td class="text-right font-bold {{ $trx->type === 'pemasukan' ? 'text-in' : ($trx->type === 'pengeluaran' ? 'text-out' : 'text-net') }}">
                        @if($trx->type === 'pemasukan')
                            +Rp {{ number_format($trx->amount, 0, ',', '.') }}
                        @elseif($trx->type === 'pengeluaran')
                            -Rp {{ number_format($trx->amount, 0, ',', '.') }}
                        @else
                            Rp {{ number_format($trx->amount, 0, ',', '.') }}
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 24px; color: #94a3b8;">
                        Tidak ada transaksi tercatat untuk periode {{ $periodLabel }}.
                    </td>
                </tr>
            @endforelse
        </tbody>
        @if(count($transactions) > 0)
            <tfoot>
                <tr class="total-row">
                    <td colspan="6" class="text-right">Subtotal Pemasukan:</td>
                    <td class="text-right text-in">+Rp {{ number_format($summary['pemasukan'], 0, ',', '.') }}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="6" class="text-right">Subtotal Pengeluaran:</td>
                    <td class="text-right text-out">-Rp {{ number_format($summary['pengeluaran'], 0, ',', '.') }}</td>
                </tr>
                @if(isset($summary['tabungan_trx']) && $summary['tabungan_trx'] > 0)
                    <tr class="total-row">
                        <td colspan="6" class="text-right">Subtotal Tabungan:</td>
                        <td class="text-right text-net">-Rp {{ number_format($summary['tabungan_trx'], 0, ',', '.') }}</td>
                    </tr>
                @endif
                <tr class="total-row-highlight">
                    <td colspan="6" class="text-right font-extrabold" style="color: #0f172a;">Arus Kas Bersih (Surplus / Defisit):</td>
                    <td class="text-right font-extrabold {{ $summary['net'] >= 0 ? 'text-in' : 'text-out' }}">
                        {{ formatRupiah($summary['net'], true) }}
                    </td>
                </tr>
            </tfoot>
        @endif
    </table>

</body>
</html>
