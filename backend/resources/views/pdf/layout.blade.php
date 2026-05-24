<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>{{ $titulo ?? 'Relatório Médico' }} — HGB</title>
    <style>
        @page { margin: 30px 40px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #222; }
        .header { border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 18px; }
        .header h1 { margin: 0; font-size: 16px; color: #003366; }
        .header .sub { font-size: 11px; color: #555; }
        .doc-title { text-align: center; font-size: 18px; font-weight: bold; margin: 14px 0 8px; color: #003366; text-transform: uppercase; }
        .doc-meta { text-align: right; font-size: 10px; color: #555; margin-bottom: 12px; }
        table.info { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.info td { padding: 4px 6px; vertical-align: top; }
        table.info td.label { font-weight: bold; width: 130px; color: #333; }
        .box { border: 1px solid #ccc; padding: 8px 10px; margin-bottom: 10px; }
        .box h3 { margin: 0 0 6px; font-size: 12px; color: #003366; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 3px; }
        .box p { margin: 4px 0; white-space: pre-wrap; }
        .footer { position: fixed; bottom: 10px; left: 40px; right: 40px; border-top: 1px solid #ccc; padding-top: 6px; font-size: 9px; color: #666; text-align: center; }
        .assinatura { margin-top: 40px; text-align: center; }
        .assinatura .linha { border-top: 1px solid #333; width: 280px; margin: 0 auto 4px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; }
        .badge-emitido { background: #d4edda; color: #155724; }
        .badge-rascunho { background: #fff3cd; color: #856404; }
        .badge-anulado { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <table style="width:100%; border:0;">
            <tr>
                <td style="width:70px; vertical-align:middle;">
                    @php $logo = public_path('logo.png'); @endphp
                    @if(file_exists($logo))
                        <img src="{{ $logo }}" alt="HGB" style="width:60px; height:60px;">
                    @endif
                </td>
                <td style="vertical-align:middle;">
                    <h1>HOSPITAL GERAL DE BENGUELA</h1>
                    <div class="sub">República de Angola · Província de Benguela</div>
                    <div class="sub">Direção Clínica</div>
                </td>
                <td style="text-align:right; vertical-align:top; font-size:10px; color:#555;">
                    Emitido em: {{ now()->format('d/m/Y H:i') }}
                </td>
            </tr>
        </table>
    </div>

    <div class="doc-title">{{ $titulo }}</div>
    <div class="doc-meta">
        Nº {{ $numero }}
        @isset($status)
            · <span class="badge badge-{{ $status }}">{{ strtoupper($status) }}</span>
        @endisset
    </div>

    @yield('content')

    <div class="footer">
        Hospital Geral de Benguela · Documento gerado eletronicamente.
        @isset($codigoVerificacao)
            Código de verificação: <strong>{{ $codigoVerificacao }}</strong>
        @endisset
    </div>
</body>
</html>
