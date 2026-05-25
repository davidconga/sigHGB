@extends('pdf.layout', [
    'titulo' => 'Comprovativo de Marcação',
    'numero' => $agendamento->numero,
    'status' => $agendamento->status,
    'codigoVerificacao' => null,
])

@section('content')
    @include('pdf._paciente', ['paciente' => $agendamento->paciente])

    <table class="info">
        <tr>
            <td class="label">Data e hora:</td>
            <td><strong>{{ $agendamento->data_agendamento->format('d/m/Y \à\s H:i') }}</strong></td>
            <td class="label">Duração prevista:</td>
            <td>{{ $agendamento->duracao_minutos }} min</td>
        </tr>
        <tr>
            <td class="label">Médico:</td>
            <td>{{ $agendamento->medico?->nome ?? '— a definir —' }}</td>
            <td class="label">Especialidade:</td>
            <td>{{ $agendamento->medico?->especialidade ?? '—' }}</td>
        </tr>
    </table>

    @if($agendamento->motivo)
        <div class="box"><h3>Motivo da consulta</h3><p>{{ $agendamento->motivo }}</p></div>
    @endif

    @if($agendamento->observacoes)
        <div class="box"><h3>Observações</h3><p>{{ $agendamento->observacoes }}</p></div>
    @endif

    <div class="box" style="background:#f0f7ff; border-color:#cfe1f5;">
        <h3>Instruções ao paciente</h3>
        <ul style="margin: 6px 0 0 16px; padding: 0;">
            <li>Compareça <strong>15 minutos antes</strong> da hora marcada.</li>
            <li>Traga este comprovativo, o seu BI e processo clínico se já possuir.</li>
            <li>Em caso de impedimento, contacte o hospital com pelo menos 24h de antecedência.</li>
        </ul>
    </div>

    <div class="assinatura">
        <div class="linha"></div>
        <div style="font-size: 10px; color: #666;">
            Comprovativo emitido em {{ now()->format('d/m/Y H:i') }}
            @if($agendamento->criadoPor) · por {{ $agendamento->criadoPor->name }} @endif
        </div>
    </div>
@endsection
