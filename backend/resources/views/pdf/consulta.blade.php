@extends('pdf.layout', [
    'titulo' => 'Relatório de Consulta Médica',
    'numero' => $consulta->numero,
    'status' => $consulta->status,
    'codigoVerificacao' => $consulta->codigo_verificacao,
])

@section('content')
    @include('pdf._paciente', ['paciente' => $consulta->paciente])

    <table class="info">
        <tr>
            <td class="label">Data da consulta:</td>
            <td>{{ $consulta->data_consulta->format('d/m/Y H:i') }}</td>
            <td class="label">CID:</td>
            <td>{{ $consulta->cid ?? '—' }}</td>
        </tr>
    </table>

    @if($consulta->queixa_principal)
        <div class="box"><h3>Queixa principal</h3><p>{{ $consulta->queixa_principal }}</p></div>
    @endif

    @if($consulta->historia_doenca)
        <div class="box"><h3>História da doença</h3><p>{{ $consulta->historia_doenca }}</p></div>
    @endif

    @if($consulta->exame_fisico)
        <div class="box"><h3>Exame físico</h3><p>{{ $consulta->exame_fisico }}</p></div>
    @endif

    <div class="box"><h3>Diagnóstico</h3><p>{{ $consulta->diagnostico }}</p></div>

    @if($consulta->prescricao)
        <div class="box"><h3>Prescrição</h3><p>{{ $consulta->prescricao }}</p></div>
    @endif

    @if($consulta->observacoes)
        <div class="box"><h3>Observações</h3><p>{{ $consulta->observacoes }}</p></div>
    @endif

    @include('pdf._assinatura', ['medico' => $consulta->medico])
@endsection
