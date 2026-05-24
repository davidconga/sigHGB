<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class ActivityController extends Controller
{
    /**
     * Activity log for a given model — used by the "Histórico" tab on
     * paciente/atestado/relatorio/medico/utilizador show pages.
     */
    public function forModel(Request $request, string $type, int $id): JsonResponse
    {
        $map = [
            'paciente'  => \App\Models\Paciente::class,
            'atestado'  => \App\Models\Atestado::class,
            'relatorio' => \App\Models\Relatorio::class,
            'medico'    => \App\Models\Medico::class,
            'user'      => \App\Models\User::class,
        ];
        abort_unless(isset($map[$type]), 404, 'Tipo desconhecido');

        $items = Activity::where('subject_type', $map[$type])
            ->where('subject_id', $id)
            ->with('causer:id,name')
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn ($a) => [
                'id'          => $a->id,
                'description' => $a->description,            // created|updated|deleted
                'log_name'    => $a->log_name,
                'changes'     => $a->properties,             // { attributes: {...}, old: {...} }
                'causer'      => $a->causer ? ['id' => $a->causer->id, 'name' => $a->causer->name] : null,
                'created_at'  => $a->created_at,
            ]);

        return response()->json($items);
    }

    /**
     * Global activity feed (admin) — last 200 changes across all models.
     */
    public function index(Request $request): JsonResponse
    {
        $items = Activity::with('causer:id,name')
            ->latest('id')
            ->limit($request->integer('limit', 200))
            ->get();
        return response()->json($items);
    }
}
