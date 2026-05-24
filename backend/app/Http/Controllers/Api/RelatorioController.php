<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Relatorio;
use App\Models\Setting;
use App\Support\AssinaturaValidator;
use App\Support\HtmlSanitizer;
use App\Support\MedicoScope;
use App\Support\QrCodeHelper;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RelatorioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MedicoScope::apply(
            Relatorio::with(['paciente:id,nome,numero_processo,bi', 'medico:id,nome,especialidade'])
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
                    ->orWhere('diagnostico', 'like', "%{$search}%")
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
        $data = HtmlSanitizer::cleanArray($data, $this->htmlFields());
        $relatorio = Relatorio::create($data);

        return response()->json($relatorio->load(['paciente', 'medico']), 201);
    }

    public function show(Relatorio $relatorio): JsonResponse
    {
        $this->guard($relatorio);
        return response()->json($relatorio->load(['paciente', 'medico']));
    }

    private function guard(Relatorio $relatorio): void
    {
        if (! MedicoScope::canAccess($relatorio)) {
            throw new AccessDeniedHttpException('Sem acesso a este relatório.');
        }
    }

    public function update(Request $request, Relatorio $relatorio): JsonResponse
    {
        $this->guard($relatorio);
        $data = $request->validate($this->rules());
        $data = HtmlSanitizer::cleanArray($data, $this->htmlFields());
        $relatorio->update($data);

        return response()->json($relatorio->load(['paciente', 'medico']));
    }

    private function htmlFields(): array
    {
        return [
            'historia_doenca', 'exame_objectivo', 'exames_complementares',
            'diagnostico', 'tratamento', 'recomendacao', 'motivo', 'causa_morte',
        ];
    }

    public function destroy(Relatorio $relatorio): JsonResponse
    {
        $this->guard($relatorio);
        $relatorio->delete();

        return response()->json(['message' => 'Relatório removido.']);
    }

    public function validar(Request $request, Relatorio $relatorio): JsonResponse
    {
        if ($relatorio->status === 'emitido') {
            return response()->json(['message' => 'Este relatório já está emitido.'], 422);
        }
        if (! $relatorio->medico_id) {
            return response()->json(['message' => 'Relatório sem médico atribuído. Atribua um médico antes de validar.'], 422);
        }

        AssinaturaValidator::validar($request, $relatorio->medico_id);

        $relatorio->update(['status' => 'emitido']);

        return response()->json($relatorio->fresh()->load(['paciente', 'medico']));
    }

    public function pdf(Relatorio $relatorio): Response
    {
        $this->guard($relatorio);
        $relatorio->load(['paciente', 'medico']);

        $qrData = $relatorio->codigo_verificacao
            ? rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/')
                . '/verificar/' . $relatorio->codigo_verificacao
            : null;

        $pdf = Pdf::loadView('pdf.relatorio', [
            'r' => $relatorio,
            'qrUri' => $qrData ? QrCodeHelper::dataUri($qrData) : null,
            'settings' => [
                'hospital_nome' => Setting::get('hospital_nome', 'Hospital Geral de Benguela'),
                'hospital_endereco' => Setting::get('hospital_endereco', 'Avenida 31 de Janeiro'),
                'hospital_localidade' => Setting::get('hospital_localidade', 'Benguela / Benguela'),
                'directora_nome' => Setting::get('directora_nome', ''),
                'directora_especialidade' => Setting::get('directora_especialidade', ''),
                'directora_titulo' => Setting::get('directora_titulo', 'A DIRECTORA CLÍNICA'),
            ],
        ]);

        return $pdf->stream("relatorio-{$relatorio->numero}.pdf");
    }

    private function rules(): array
    {
        return [
            'paciente_id' => ['required', 'exists:pacientes,id'],
            'medico_id' => ['nullable', 'exists:medicos,id'],
            'tipo' => ['required', 'in:relatorio_medico,junta_medica,fisioterapeutico,informacao_clinica,nota_alta,guia_transferencia'],
            'subtitulo' => ['nullable', 'string', 'max:255'],
            'data_emissao' => ['required', 'date'],
            'historia_doenca' => ['required', 'string'],
            'exame_objectivo' => ['nullable', 'string'],
            'exames_complementares' => ['nullable', 'string'],
            'diagnostico' => ['required', 'string'],
            'cid' => ['nullable', 'string', 'max:10'],
            'tratamento' => ['nullable', 'string'],
            'recomendacao' => ['nullable', 'string'],
            'motivo' => ['nullable', 'string'],
            'grau_discapacidade' => ['nullable', 'integer', 'min:0', 'max:100'],
            'causa_morte' => ['nullable', 'string'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
        ];
    }
}
