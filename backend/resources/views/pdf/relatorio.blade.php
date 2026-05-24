<?php
    $p = $r->paciente;
    $m = $r->medico;
    $idade = $p->data_nascimento ? $p->data_nascimento->age : null;
    $brasao = public_path('signa_rebuplica.png');
    $logoGov = public_path('governo_ao.png');
    $logoHgb = public_path('logo.png');

    $medicoAssinatura = $m && $m->assinatura_path ? storage_path('app/public/'.$m->assinatura_path) : null;
    $medicoCarimbo = $m && $m->carimbo_path ? storage_path('app/public/'.$m->carimbo_path) : null;

    $sexoLabel = $p->sexo === 'F' ? 'Feminino' : ($p->sexo === 'M' ? 'Masculino' : '—');
    $residencia = trim(($p->bairro ? $p->bairro . ', ' : '') . ($p->municipio ?? ''), ', ') ?: '—';
    $naturalidade = $p->naturalidade_municipio
        ?: ($p->naturalidade_provincia ?: '—');

    $mesesPt = [
        1 => 'JANEIRO', 2 => 'FEVEREIRO', 3 => 'MARÇO', 4 => 'ABRIL',
        5 => 'MAIO', 6 => 'JUNHO', 7 => 'JULHO', 8 => 'AGOSTO',
        9 => 'SETEMBRO', 10 => 'OUTUBRO', 11 => 'NOVEMBRO', 12 => 'DEZEMBRO',
    ];
    $dataExtenso = $r->data_emissao->day . ' DE ' . $mesesPt[$r->data_emissao->month] . ' DE ' . $r->data_emissao->year;

    $diagnosticoLabel = in_array($r->tipo, ['relatorio_medico', 'fisioterapeutico', 'guia_transferencia'], true)
        ? 'HIPÓTESE DE DIAGNÓSTICO'
        : 'DIAGNÓSTICO';

    $motivoLabel = match ($r->tipo) {
        'junta_medica' => 'MOTIVO DA EVACUAÇÃO',
        'guia_transferencia' => 'MOTIVO DA TRANSFERÊNCIA',
        'nota_alta' => 'MOTIVO DA ALTA',
        default => 'MOTIVO',
    };

    $tratamentoLabel = $r->tipo === 'junta_medica' ? 'TRATAMENTO EFETUADO' : 'TRATAMENTO EFECTUADO';
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>{{ $r->titulo_pdf }} Nº {{ $r->numero }}</title>
    <style>
        @page { margin: 36px 56px 40px; }

        body {
            font-family: 'DejaVu Serif', Georgia, serif;
            font-size: 12px;
            color: #222;
            line-height: 1.55;
        }

        /* Autenticação vertical na margem esquerda */
        .auth-vertical {
            position: fixed;
            left: -36px;
            bottom: 56px;
            transform: rotate(-90deg);
            transform-origin: 0 0;
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 7.5px;
            color: #888;
            letter-spacing: 2px;
            white-space: nowrap;
        }
        .auth-vertical strong { color: #1a3a5c; }

        /* Watermark RASCUNHO — só visível em rascunho */
        .rascunho-watermark {
            position: fixed;
            top: 320px; left: 0; right: 0;
            text-align: center;
            transform: rotate(-30deg);
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 130px;
            color: rgba(220, 38, 38, 0.18);
            letter-spacing: 18px;
            z-index: 100;
            pointer-events: none;
        }

        /* Watermark — logótipo HGB esbatido ao centro */
        .watermark {
            position: fixed;
            top: 220px; left: 50%;
            margin-left: -200px;
            width: 400px; height: 400px;
            opacity: 0.05;
            z-index: -1;
        }

        /* ---------- CABEÇALHO INSTITUCIONAL ---------- */
        .cabecalho { text-align: center; margin-bottom: 6px; }
        .cabecalho img { width: 68px; margin-bottom: 4px; }
        .cabecalho .linha-org {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 12px;
            line-height: 1.35;
            letter-spacing: 0.3px;
        }
        .cabecalho .linha-org div:last-child { font-size: 13px; }

        /* ---------- TÍTULO DO RELATÓRIO ---------- */
        .titulo-wrap {
            text-align: center;
            margin: 20px 0 6px;
        }
        .titulo {
            display: inline-block;
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 17px;
            color: #b51e1e;
            padding: 0 14px 4px;
            border-bottom: 1.5px solid #b51e1e;
            letter-spacing: 0.5px;
        }
        .subtitulo {
            text-align: center;
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 13px;
            margin: 12px 0 4px;
            color: #1a3a5c;
            letter-spacing: 0.5px;
        }

        /* ---------- BLOCO DE IDENTIFICAÇÃO ---------- */
        .secao-rotulo {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 11px;
            color: #1a3a5c;
            letter-spacing: 1px;
            margin: 18px 0 6px;
            padding-bottom: 2px;
            border-bottom: 1px solid #d0d0d0;
        }
        .id-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        .id-table td {
            padding: 3px 0;
            vertical-align: top;
            font-size: 12px;
        }
        .id-table .lbl {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            width: 135px;
            color: #333;
            padding-right: 6px;
            white-space: nowrap;
        }
        .id-table .lbl-mid {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            width: 120px;
            color: #333;
            padding: 3px 6px 3px 18px;
            white-space: nowrap;
        }
        .id-table .val { color: #111; }

        /* ---------- RESUMO CLÍNICO ---------- */
        .resumo-titulo {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            text-align: center;
            font-weight: bold;
            font-size: 15px;
            color: #1a3a5c;
            margin: 22px 0 14px;
            letter-spacing: 1.5px;
        }
        .resumo-titulo:before, .resumo-titulo:after {
            content: ' — ';
            color: #999;
        }

        .corpo p {
            text-align: justify;
            margin: 0 0 11px;
            line-height: 1.65;
        }
        .corpo .label {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            font-size: 11.5px;
            letter-spacing: 0.3px;
        }
        .corpo .cid-tag {
            display: inline-block;
            background: #eef3f8;
            color: #1a3a5c;
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 10px;
            padding: 1px 6px;
            border-radius: 3px;
            margin-left: 4px;
            border: 1px solid #cfd9e3;
        }
        .corpo .grau {
            display: inline-block;
            background: #fff5e6;
            color: #8a5a00;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 3px;
            border: 1px solid #e9c277;
        }

        /* ---------- LOCAL E DATA ---------- */
        .data-local {
            text-align: center;
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11.5px;
            margin: 28px 0 6px;
            letter-spacing: 0.5px;
        }

        /* ---------- ASSINATURAS ---------- */
        .ass-table {
            width: 100%;
            margin-top: 16px;
            border-collapse: collapse;
        }
        .ass-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 14px;
        }
        .ass-cab {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 11px;
            letter-spacing: 0.6px;
            color: #333;
            margin-bottom: 4px;
        }
        .ass-zona {
            position: relative;
            height: 72px;
        }
        .ass-zona img.sig { max-height: 56px; max-width: 200px; }
        .ass-zona img.car { max-height: 64px; max-width: 110px; opacity: 0.85; margin-left: -28px; }
        .ass-linha {
            border-top: 1px solid #222;
            margin: 0 28px 4px;
        }
        .ass-nome {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: bold;
            font-size: 11px;
            color: #111;
        }
        .ass-esp {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9.5px;
            color: #555;
            margin-top: 1px;
        }

        /* ---------- QR ---------- */
        .qr-block {
            text-align: center;
            margin-top: 24px;
        }
        .qr-block img { width: 92px; height: 92px; }
        .qr-block .qr-cap {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 8.5px;
            color: #666;
            margin-top: 2px;
            letter-spacing: 0.3px;
        }
        .qr-block .qr-code {
            font-family: monospace;
            font-size: 8px;
            color: #888;
        }

        /* ---------- RODAPÉ ---------- */
        .rodape {
            position: fixed;
            bottom: -22px;
            left: 56px;
            right: 56px;
            padding-top: 4px;
            border-top: 2px solid #1a3a5c;
        }
        .rodape table { width: 100%; }
        .rodape td { vertical-align: middle; }
        .rodape .hgb-img { width: 38px; height: 38px; }
        .rodape .gov-img { width: 130px; }
        .rodape .info {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9.5px;
            color: #333;
            line-height: 1.35;
            padding: 0 8px;
        }
        .rodape .info strong { color: #1a3a5c; }
    </style>
</head>
<body>

    {{-- Watermark --}}
    @if(file_exists($logoHgb))
        <img src="{{ $logoHgb }}" class="watermark" alt="">
    @endif

    @if($r->status === 'rascunho')
        <div class="rascunho-watermark">RASCUNHO</div>
    @endif
    @if($r->status === 'anulado')
        <div class="rascunho-watermark" style="color:rgba(220,38,38,0.3);">ANULADO</div>
    @endif

    {{-- Autenticação vertical na margem esquerda --}}
    <div class="auth-vertical">
        AUTENTICAÇÃO &nbsp;·&nbsp; <strong>{{ $r->titulo_pdf }} Nº {{ $r->numero }}</strong>
        @if($r->codigo_verificacao) &nbsp;·&nbsp; CÓDIGO <strong>{{ $r->codigo_verificacao }}</strong> @endif
        &nbsp;·&nbsp; {{ mb_strtoupper($settings['hospital_nome']) }}
    </div>

    {{-- ============================ CABEÇALHO ============================ --}}
    <div class="cabecalho">
        @if(file_exists($brasao))
            <img src="{{ $brasao }}" alt="Brasão de Angola">
        @endif
        <div class="linha-org">
            <div>REPÚBLICA DE ANGOLA</div>
            <div>GOVERNO PROVINCIAL DE BENGUELA</div>
            <div>{{ mb_strtoupper($settings['hospital_nome']) }}</div>
        </div>
    </div>

    {{-- ============================ TÍTULO ============================ --}}
    <div class="titulo-wrap">
        <span class="titulo">{{ $r->titulo_pdf }} Nº {{ $r->numero }}</span>
    </div>

    @if($r->subtitulo)
        <div class="subtitulo">{{ mb_strtoupper($r->subtitulo) }}</div>
    @endif

    {{-- ======================== IDENTIFICAÇÃO ======================== --}}
    <div class="secao-rotulo">IDENTIFICAÇÃO</div>

    <table class="id-table">
        <tr>
            <td class="lbl">Nome :</td>
            <td class="val" colspan="3">{{ $p->nome }}</td>
        </tr>
        <tr>
            <td class="lbl">Género &amp; Idade :</td>
            <td class="val">{{ $sexoLabel }} &amp; {{ $idade ?? '—' }} Anos</td>
            <td class="lbl-mid">Estado Civil :</td>
            <td class="val">{{ $p->estado_civil ?? '—' }}</td>
        </tr>
        <tr>
            <td class="lbl">Naturalidade :</td>
            <td class="val">{{ $naturalidade }}</td>
            <td class="lbl-mid">Residência :</td>
            <td class="val">{{ $residencia }}</td>
        </tr>
        @if($p->bi || $p->numero_processo)
            <tr>
                @if($p->numero_processo)
                    <td class="lbl">Nº Processo :</td>
                    <td class="val" style="font-family: monospace;">{{ $p->numero_processo }}</td>
                @else
                    <td colspan="2"></td>
                @endif
                @if($p->bi)
                    <td class="lbl-mid">B.I. :</td>
                    <td class="val" style="font-family: monospace;">{{ $p->bi }}</td>
                @else
                    <td colspan="2"></td>
                @endif
            </tr>
        @endif
    </table>

    {{-- ======================== RESUMO CLÍNICO ======================== --}}
    <div class="resumo-titulo">RESUMO CLÍNICO</div>

    <div class="corpo">
        <div>
            <span class="label">História da doença actual :</span>
            {!! $r->historia_doenca !!}
        </div>

        @if($r->exame_objectivo)
            <div>
                <span class="label">Exame objectivo :</span>
                {!! $r->exame_objectivo !!}
            </div>
        @endif

        @if($r->exames_complementares)
            <div>
                <span class="label">Exames complementares :</span>
                {!! $r->exames_complementares !!}
            </div>
        @endif

        <div>
            <span class="label">{{ $diagnosticoLabel }} :</span>
            {!! $r->diagnostico !!}@if($r->cid)<span class="cid-tag">CID {{ $r->cid }}</span>@endif
        </div>

        @if($r->grau_discapacidade !== null)
            <p>
                <span class="label">Grau de Discapacidade :</span>
                <span class="grau">{{ $r->grau_discapacidade }}%</span>
            </p>
        @endif

        @if($r->tratamento)
            <div>
                <span class="label">{{ $tratamentoLabel }} :</span>
                {!! $r->tratamento !!}
            </div>
        @endif

        @if($r->recomendacao)
            <div>
                <span class="label">Recomendação :</span>
                {!! $r->recomendacao !!}
            </div>
        @endif

        @if($r->tipo === 'informacao_clinica' && $r->causa_morte)
            <div>
                <span class="label" style="color:#b51e1e;">Diagnóstico que foi causa da morte :</span>
                {!! $r->causa_morte !!}
            </div>
        @endif

        @if($r->motivo)
            <div>
                <span class="label">{{ $motivoLabel }} :</span>
                {!! $r->motivo !!}
            </div>
        @endif
    </div>

    {{-- ============================ QR + DATA + ASSINATURAS ============================ --}}
    @if($qrUri)
        <div class="qr-block">
            <img src="{{ $qrUri }}" alt="QR">
            <div class="qr-cap">Verifique a autenticidade</div>
            @if($r->codigo_verificacao)
                <div class="qr-code">{{ $r->codigo_verificacao }}</div>
            @endif
        </div>
    @endif

    <div class="data-local">
        {{ mb_strtoupper($settings['hospital_nome']) }}, AOS {{ $dataExtenso }}
    </div>

    <table class="ass-table">
        <tr>
            <td>
                <div class="ass-cab">O MÉDICO ASSISTENTE</div>
                <div class="ass-zona">
                    @if($medicoAssinatura && file_exists($medicoAssinatura))
                        <img src="{{ $medicoAssinatura }}" class="sig" alt="">
                    @endif
                    @if($medicoCarimbo && file_exists($medicoCarimbo))
                        <img src="{{ $medicoCarimbo }}" class="car" alt="">
                    @endif
                </div>
                <div class="ass-linha"></div>
                @if($m)
                    <div class="ass-nome">{{ $m->nome }}</div>
                    <div class="ass-esp">{{ $m->especialidade }} · Ordem nº {{ $m->numero_ordem }}</div>
                @else
                    <div class="ass-esp" style="font-style:italic;">(médico não atribuído)</div>
                @endif
            </td>
            <td>
                <div class="ass-cab">{{ mb_strtoupper($settings['directora_titulo']) }}</div>
                <div class="ass-zona"></div>
                <div class="ass-linha"></div>
                @if($settings['directora_nome'])
                    <div class="ass-nome">{{ mb_strtoupper($settings['directora_nome']) }}</div>
                    @if($settings['directora_especialidade'])
                        <div class="ass-esp">= {{ mb_strtoupper($settings['directora_especialidade']) }} =</div>
                    @endif
                @endif
            </td>
        </tr>
    </table>

    {{-- ============================ RODAPÉ ============================ --}}
    <div class="rodape">
        <table>
            <tr>
                <td style="width: 48px;">
                    @if(file_exists($logoHgb))
                        <img src="{{ $logoHgb }}" alt="HGB" class="hgb-img">
                    @endif
                </td>
                <td class="info">
                    <strong>{{ $settings['hospital_nome'] }}</strong><br>
                    {{ $settings['hospital_endereco'] }} · {{ $settings['hospital_localidade'] }}
                </td>
                <td style="width: 140px; text-align: right;">
                    @if(file_exists($logoGov))
                        <img src="{{ $logoGov }}" alt="Governo de Angola" class="gov-img">
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
