<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Atestado;
use App\Support\AssinaturaValidator;
use App\Support\HtmlSanitizer;
use App\Support\MedicoScope;
use App\Support\QrCodeHelper;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AtestadoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MedicoScope::apply(
            Atestado::with(['paciente:id,nome,numero_processo,bi', 'medico:id,nome,especialidade'])
        );

        if ($pid = $request->integer('paciente_id')) {
            $query->where('paciente_id', $pid);
        }
        if ($mid = $request->integer('medico_id')) {
            $query->where('medico_id', $mid);
        }
        if ($tipo = $request->string('tipo')->value()) {
            $query->where('tipo', $tipo);
        }
        if ($destino = $request->string('destino')->value()) {
            $query->where('destino', $destino);
        }
        if ($status = $request->string('status')->value()) {
            $query->where('status', $status);
        }
        if ($de = $request->date('data_de')) {
            $query->whereDate('data_emissao', '>=', $de);
        }
        if ($ate = $request->date('data_ate')) {
            $query->whereDate('data_emissao', '<=', $ate);
        }
        if ($cid = $request->string('cid')->value()) {
            $query->where('cid', 'like', "{$cid}%");
        }
        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                    ->orWhere('motivo', 'like', "%{$search}%")
                    ->orWhereHas('paciente', function ($p) use ($search) {
                        $p->where('nome', 'like', "%{$search}%")
                            ->orWhere('bi', 'like', "%{$search}%")
                            ->orWhere('numero_processo', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json(
            $query->latest('data_emissao')->paginate($request->integer('per_page', 15))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data = HtmlSanitizer::cleanArray($data, ['diagnostico', 'motivo', 'observacoes']);
        $atestado = Atestado::create($data);

        return response()->json($atestado->load(['paciente', 'medico']), 201);
    }

    public function show(Atestado $atestado): JsonResponse
    {
        $this->guard($atestado);
        return response()->json($atestado->load(['paciente', 'medico']));
    }

    private function guard(Atestado $a): void
    {
        if (! MedicoScope::canAccess($a)) {
            throw new AccessDeniedHttpException('Sem acesso a este atestado.');
        }
    }

    public function update(Request $request, Atestado $atestado): JsonResponse
    {
        $this->guard($atestado);
        $data = $request->validate($this->rules());
        $data = HtmlSanitizer::cleanArray($data, ['diagnostico', 'motivo', 'observacoes']);
        $atestado->update($data);

        return response()->json($atestado->load(['paciente', 'medico']));
    }

    public function destroy(Atestado $atestado): JsonResponse
    {
        $this->guard($atestado);
        $atestado->delete();

        return response()->json(['message' => 'Atestado removido.']);
    }

    public function validar(Request $request, Atestado $atestado): JsonResponse
    {
        if ($atestado->status === 'emitido') {
            return response()->json(['message' => 'Este atestado já está emitido.'], 422);
        }
        if (! $atestado->medico_id) {
            return response()->json(['message' => 'Atestado sem médico atribuído. Atribua um médico antes de validar.'], 422);
        }

        AssinaturaValidator::validar($request, $atestado->medico_id);

        $atestado->update(['status' => 'emitido']);
        // O codigo_verificacao é gerado automaticamente pelo trait quando muda para 'emitido'

        return response()->json($atestado->fresh()->load(['paciente', 'medico']));
    }

    public function pdf(Atestado $atestado, Request $request): Response
    {
        $this->guard($atestado);
        $atestado->load(['paciente', 'medico']);

        $qrData = $atestado->codigo_verificacao
            ? rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/')
                . '/verificar/' . $atestado->codigo_verificacao
            : null;

        $qrUri = $qrData ? QrCodeHelper::dataUri($qrData) : null;

        $pdf = Pdf::loadView('pdf.atestado', [
            'atestado' => $atestado,
            'qrUri' => $qrUri,
            'qrLink' => $qrData,
        ]);

        return $pdf->stream("atestado-{$atestado->numero}.pdf");
    }

    private function rules(): array
    {
        return [
            'paciente_id' => ['required', 'exists:pacientes,id'],
            'medico_id' => ['nullable', 'exists:medicos,id'],
            'tipo' => ['required', 'in:repouso,comparecimento,aptidao,outros'],
            'data_emissao' => ['required', 'date'],
            'data_inicio_repouso' => ['nullable', 'date'],
            'data_fim_repouso' => ['nullable', 'date', 'after_or_equal:data_inicio_repouso'],
            'dias_repouso' => ['nullable', 'integer', 'min:1'],
            'diagnostico' => ['nullable', 'string'],
            'cid' => ['nullable', 'string', 'max:10'],
            'motivo' => ['nullable', 'string'],
            'destino' => ['nullable', 'string', 'max:120'],
            'observacoes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
        ];
    }
}
