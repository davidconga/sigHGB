@extends('pdf.layout', [
    'titulo' => 'Mapa de Marcações',
    'numero' => $de->format('Y-m'),
    'status' => null,
    'codigoVerificacao' => null,
])

@section('content')
    @php
        $totais = $stats['totais'];
        $porMedico = $stats['por_medico'];
        $ordemEstados = ['pendente', 'confirmada', 'presente', 'em_atendimento', 'realizada', 'cancelada', 'faltou'];
        $labelEstados = [
            'pendente' => 'Pend.',
            'confirmada' => 'Conf.',
            'presente' => 'Pres.',
            'em_atendimento' => 'Atend.',
            'realizada' => 'Real.',
            'cancelada' => 'Canc.',
            'faltou' => 'Falt.',
        ];
    @endphp

    <table class="info">
        <tr>
            <td class="label">Período:</td>
            <td>{{ $de->format('d/m/Y') }} a {{ $ate->format('d/m/Y') }}</td>
            <td class="label">Emitido em:</td>
            <td>{{ now()->format('d/m/Y H:i') }}</td>
        </tr>
    </table>

    <div class="box">
        <h3>Resumo do período</h3>
        <table style="width:100%; border-collapse: collapse; margin-top: 4px;">
            <tr>
                <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #eee;">
                    <div style="font-size: 22px; font-weight: bold; color:#003366;">{{ $totais['total'] }}</div>
                    <div style="font-size: 9px; color: #666;">Total</div>
                </td>
                <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #eee;">
                    <div style="font-size: 22px; font-weight: bold; color:#10b981;">{{ $totais['realizadas'] }}</div>
                    <div style="font-size: 9px; color: #666;">Realizadas</div>
                </td>
                <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #eee;">
                    <div style="font-size: 22px; font-weight: bold; color:#dc2626;">{{ $totais['faltou'] }}</div>
                    <div style="font-size: 9px; color: #666;">Faltou</div>
                </td>
                <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #eee;">
                    <div style="font-size: 22px; font-weight: bold; color:#d97706;">{{ $totais['canceladas'] }}</div>
                    <div style="font-size: 9px; color: #666;">Canceladas</div>
                </td>
                <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #eee;">
                    <div style="font-size: 22px; font-weight: bold; color:#10b981;">{{ $totais['taxa_conclusao'] }}%</div>
                    <div style="font-size: 9px; color: #666;">Taxa conclusão</div>
                </td>
                <td style="padding: 4px 8px; text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color:#dc2626;">{{ $totais['taxa_absenteismo'] }}%</div>
                    <div style="font-size: 9px; color: #666;">Absenteísmo</div>
                </td>
            </tr>
        </table>
    </div>

    @if(count($porMedico))
        <div class="box">
            <h3>Por médico</h3>
            <table style="width:100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="text-align:left; padding:4px 6px; border:1px solid #e5e7eb;">Médico</th>
                        <th style="text-align:left; padding:4px 6px; border:1px solid #e5e7eb;">Especialidade</th>
                        @foreach($ordemEstados as $st)
                            <th style="text-align:right; padding:4px 6px; border:1px solid #e5e7eb;">{{ $labelEstados[$st] }}</th>
                        @endforeach
                        <th style="text-align:right; padding:4px 6px; border:1px solid #e5e7eb;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($porMedico as $m)
                        <tr>
                            <td style="padding:4px 6px; border:1px solid #e5e7eb;">{{ $m['medico'] }}</td>
                            <td style="padding:4px 6px; border:1px solid #e5e7eb;">{{ $m['especialidade'] ?? '—' }}</td>
                            @foreach($ordemEstados as $st)
                                <td style="text-align:right; padding:4px 6px; border:1px solid #e5e7eb;">{{ $m['por_estado'][$st] ?? 0 }}</td>
                            @endforeach
                            <td style="text-align:right; padding:4px 6px; border:1px solid #e5e7eb; font-weight:bold;">{{ $m['total'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <div style="text-align:right; font-size: 9px; color:#666; margin-top: 8px;">
        Gerado automaticamente pelo SIGHGB · {{ now()->format('d/m/Y H:i') }}
    </div>
@endsection
