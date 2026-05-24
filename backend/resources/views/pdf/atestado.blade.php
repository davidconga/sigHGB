<?php
    $p = $atestado->paciente;
    $m = $atestado->medico;
    $idade = $p->data_nascimento ? $p->data_nascimento->age : null;
    $brasao = public_path('signa_rebuplica.png');
    $logoGov = public_path('governo_ao.png');
    $logoHgb = public_path('logo.png');

    $medicoAssinatura = $m && $m->assinatura_path ? storage_path('app/public/'.$m->assinatura_path) : null;
    $medicoCarimbo = $m && $m->carimbo_path ? storage_path('app/public/'.$m->carimbo_path) : null;

    $mesesPt = [
        1 => 'JANEIRO', 2 => 'FEVEREIRO', 3 => 'MARÇO', 4 => 'ABRIL',
        5 => 'MAIO', 6 => 'JUNHO', 7 => 'JULHO', 8 => 'AGOSTO',
        9 => 'SETEMBRO', 10 => 'OUTUBRO', 11 => 'NOVEMBRO', 12 => 'DEZEMBRO',
    ];
    $dataExtenso = $atestado->data_emissao->day . ' DE ' . $mesesPt[$atestado->data_emissao->month] . ' DE ' . $atestado->data_emissao->year;
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Atestado Médico Nº {{ $atestado->numero }}</title>
    <style>
        @page { margin: 30px 50px 40px; }
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
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; line-height: 1.5; }
        .brasao { text-align: center; margin-bottom: 8px; }
        .brasao img { width: 65px; }
        .org { text-align: center; font-weight: bold; font-size: 12px; line-height: 1.3; }
        .org div:last-child { margin-bottom: 16px; }
        .titulo { text-align: center; font-weight: bold; font-size: 18px; margin: 16px 0 22px; }
        .corpo { text-align: justify; font-size: 12.5px; line-height: 1.75; }
        .corpo strong { color: #000; }
        .corpo .fld { border-bottom: 1px dotted #777; padding: 0 6px; font-weight: bold; }
        .data-local { text-align: center; margin-top: 26px; font-weight: bold; letter-spacing: 0.5px; }
        .assinatura { text-align: center; margin-top: 38px; }
        .assinatura .linha { display: inline-block; border-top: 1px solid #000; width: 280px; padding-top: 4px; }
        .qr-block { position: absolute; left: 50px; bottom: 130px; text-align: center; font-size: 9px; }
        .qr-block img { width: 90px; height: 90px; }
        .aviso { position: fixed; bottom: 38px; left: 50px; right: 50px; text-align: center; color: #c00; font-weight: bold; font-size: 11px; border-top: 1px dashed #ccc; padding-top: 6px; }
        .rodape { position: fixed; bottom: -22px; left: 50px; right: 50px; padding-top: 4px; border-top: 1px solid #999; }
        .auth-vertical {
            position: fixed;
            left: -36px;
            bottom: 60px;
            transform: rotate(-90deg);
            transform-origin: 0 0;
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 7.5px;
            color: #888;
            letter-spacing: 2px;
            white-space: nowrap;
        }
        .auth-vertical strong { color: #1a3a5c; }
        .rodape table { width: 100%; }
        .rodape td { vertical-align: middle; font-size: 10px; }
        .rodape .hgb-img { width: 38px; height: 38px; }
        .rodape .gov-img { width: 130px; }
        .gov-text { font-size: 8.5px; color: #c00; font-weight: bold; line-height: 1; }
    </style>
</head>
<body>

    <div class="auth-vertical">
        AUTENTICAÇÃO &nbsp;·&nbsp; <strong>ATESTADO Nº {{ $atestado->numero }}</strong>
        @if($atestado->codigo_verificacao) &nbsp;·&nbsp; CÓDIGO <strong>{{ $atestado->codigo_verificacao }}</strong> @endif
        &nbsp;·&nbsp; HOSPITAL GERAL DE BENGUELA
    </div>

    @if($atestado->status === 'rascunho')
        <div class="rascunho-watermark">RASCUNHO</div>
    @endif
    @if($atestado->status === 'anulado')
        <div class="rascunho-watermark" style="color:rgba(220,38,38,0.3);">ANULADO</div>
    @endif

    <div class="brasao">
        @if(file_exists($brasao))
            <img src="{{ $brasao }}" alt="Brasão de Angola">
        @endif
    </div>
    <div class="org">
        <div>REPÚBLICA DE ANGOLA</div>
        <div>GOVERNO PROVINCIAL DE BENGUELA</div>
        <div>HOSPITAL GERAL DE BENGUELA</div>
    </div>

    <div class="titulo">ATESTADO MÉDICO Nº {{ $atestado->numero }}</div>

    <div class="corpo">
        <p>
            Dr. <span class="fld">{{ $m?->nome ?? '________________________________' }}</span> MÉDICO Hospital Geral de Benguela com o nº
            <span class="fld">{{ $m?->numero_ordem ?? '__________' }}</span> da Ordem dos Médicos Angolanos.
        </p>

        <p>
            Atesto que, tendo observado: <strong>{{ mb_strtoupper($p->nome) }}</strong>
            @if($p->naturalidade_provincia || $p->naturalidade_municipio)
                Natural de Província de <strong>{{ $p->naturalidade_provincia ?? '—' }}</strong>
                e Município de <strong>{{ $p->naturalidade_municipio ?? '—' }}</strong>,
            @endif
            @if($p->municipio)
                Residente no Município de <strong>{{ mb_strtoupper($p->municipio) }}</strong>
            @endif
            @if($idade)
                de <strong>{{ $idade }}</strong> Anos de idade,
            @endif
            @if($p->bi)
                portador do B.I. Nº <strong>{{ $p->bi }}</strong>
                @if($p->bi_emissao_local)
                    Passado pelo Arquivo de identificação de <strong>{{ mb_strtoupper($p->bi_emissao_local) }}</strong>
                @endif
                @if($p->bi_emissao_data)
                    aos <strong>{{ $p->bi_emissao_data->format('d/m/Y') }}</strong>,
                @endif
            @endif
            @if($p->nome_pai || $p->nome_mae)
                Filho(a) de <strong>{{ mb_strtoupper($p->nome_pai ?? '—') }}</strong>
                e <strong>{{ mb_strtoupper($p->nome_mae ?? '—') }}</strong>.
            @endif
        </p>

        <p>
            Verifiquei que o utente goza de boa saúde física e mental e que não sofre de doença
            infecto contagiosa particularmente de tuberculose pulmonar evolutiva, e tem
            robustez física necessária para <strong>{{ mb_strtoupper(strip_tags($atestado->motivo ?? '—')) }}</strong>.
            Este ATESTADO, destina-se única e exclusivamente para efeito de
            <strong>{{ mb_strtoupper($atestado->destino ?? '—') }}</strong>.
        </p>

        <p>
            E, por ser verdade e me ter sido pedido, mandei passar o presente Atestado que
            sob minha honra vou assinar e autenticar com o selo a seco em uso neste Hospital.
        </p>
    </div>

    <div class="data-local">HOSPITAL GERAL DE BENGUELA, AOS {{ $dataExtenso }}</div>

    <div class="assinatura">
        <div style="margin-bottom: 4px;">O MÉDICO</div>
        <div style="height: 60px; position: relative;">
            @if($medicoAssinatura && file_exists($medicoAssinatura))
                <img src="{{ $medicoAssinatura }}" alt="Assinatura" style="max-height: 55px; max-width: 200px;">
            @endif
            @if($medicoCarimbo && file_exists($medicoCarimbo))
                <img src="{{ $medicoCarimbo }}" alt="Carimbo" style="max-height: 65px; max-width: 110px; margin-left: -30px; opacity: 0.85;">
            @endif
        </div>
        <div class="linha"></div>
        @if($m)
            <div style="font-weight: bold;">{{ $m->nome }}</div>
            <div style="font-size: 10px; color: #444;">{{ $m->especialidade }} · Ordem nº {{ $m->numero_ordem }}</div>
        @endif
    </div>

    @if($qrUri)
        <div class="qr-block">
            <img src="{{ $qrUri }}" alt="Verificar autenticidade">
            <div>Verifique a autenticidade</div>
            @if($atestado->codigo_verificacao)
                <div style="font-family: monospace; font-size: 8px; margin-top: 2px;">
                    {{ $atestado->codigo_verificacao }}
                </div>
            @endif
        </div>
    @endif

    <div class="aviso">Atenção ! Não é valído o documento sem o selo seco</div>

    <div class="rodape">
        <table>
            <tr>
                <td style="width: 50px;">
                    @if(file_exists($logoHgb))
                        <img src="{{ $logoHgb }}" alt="HGB" class="hgb-img">
                    @endif
                </td>
                <td><strong>| Hospital Geral de Benguela | Avenida 31 de Janeiro | Benguela / Benguela</strong></td>
                <td style="width: 140px; text-align: right;">
                    @if(file_exists($logoGov))
                        <img src="{{ $logoGov }}" alt="Governo de Angola" class="gov-img">
                    @else
                        <div class="gov-text">GOVERNO DE<br>ANGOLA</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
