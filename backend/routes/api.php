<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AltaController;
use App\Http\Controllers\Api\AtestadoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CidController;
use App\Http\Controllers\Api\ConsultaController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartamentoController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ExameController;
use App\Http\Controllers\Api\FuncionarioController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\MedicoController;
use App\Http\Controllers\Api\PacienteAnexoController;
use App\Http\Controllers\Api\PacienteController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\RelatorioController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ServicoController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SmsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VerificacaoController;
use Illuminate\Support\Facades\Route;

// Rate limits: login is brute-force vector; register is spam vector.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [RegistrationController::class, 'register'])->middleware('throttle:5,1');
Route::get('/verificar/{codigo}', [VerificacaoController::class, 'show']);
Route::get('/registo/opcoes', function () {
    return response()->json([
        'departamentos' => App\Models\Departamento::orderBy('nome')->get(['id', 'nome']),
        'servicos'      => App\Models\Servico::orderBy('nome')->get(['id', 'nome', 'departamento_id']),
    ]);
});

Route::get('/app/android', function () {
    $path = public_path('downloads/sighgb.apk');
    if (! is_file($path)) {
        return response()->json(['exists' => false]);
    }
    // Pull the version from mobile/app.json (single source of truth — eas build
    // reads the same field). Falls back to 1.0.0 if the file can't be read.
    $version = '1.0.0';
    $appJson = base_path('../mobile/app.json');
    if (is_file($appJson)) {
        $cfg = json_decode(file_get_contents($appJson), true);
        $version = $cfg['expo']['version'] ?? $version;
    }
    return response()->json([
        'exists'    => true,
        'url'       => url('/downloads/sighgb.apk'),
        'size'      => filesize($path),
        'updated_at'=> date('c', filemtime($path)),
        'version'   => $version,
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Audit log
    Route::get('/activity/{type}/{id}', [ActivityController::class, 'forModel']);
    Route::middleware('role:admin')->get('/activity', [ActivityController::class, 'index']);
    Route::post('/devices/register', [DeviceController::class, 'register']);
    Route::post('/devices/unregister', [DeviceController::class, 'unregister']);

    // Lookups públicos (Angola)
    Route::get('/provincias', [LocationController::class, 'provincias']);
    Route::get('/municipios', [LocationController::class, 'municipios']);

    // Pacientes
    Route::middleware('permission:pacientes.view')->group(function () {
        Route::get('pacientes', [PacienteController::class, 'index']);
        Route::get('pacientes/{paciente}', [PacienteController::class, 'show']);
    });
    Route::post('pacientes', [PacienteController::class, 'store'])->middleware('permission:pacientes.create');
    Route::match(['put', 'patch'], 'pacientes/{paciente}', [PacienteController::class, 'update'])->middleware('permission:pacientes.update');
    Route::delete('pacientes/{paciente}', [PacienteController::class, 'destroy'])->middleware('permission:pacientes.delete');

    // Anexos do paciente (BI, prescrições, etc.)
    Route::middleware('permission:pacientes.view')->group(function () {
        Route::get('pacientes/{paciente}/anexos', [PacienteAnexoController::class, 'index']);
    });
    Route::post('pacientes/{paciente}/anexos', [PacienteAnexoController::class, 'store'])->middleware('permission:pacientes.update');
    Route::delete('pacientes/{paciente}/anexos/{anexo}', [PacienteAnexoController::class, 'destroy'])->middleware('permission:pacientes.update');

    // Médicos
    Route::middleware('permission:medicos.view')->group(function () {
        Route::get('medicos', [MedicoController::class, 'index']);
        Route::get('medicos/{medico}', [MedicoController::class, 'show']);
    });
    Route::post('medicos', [MedicoController::class, 'store'])->middleware('permission:medicos.create');
    Route::match(['put', 'patch'], 'medicos/{medico}', [MedicoController::class, 'update'])->middleware('permission:medicos.update');
    Route::delete('medicos/{medico}', [MedicoController::class, 'destroy'])->middleware('permission:medicos.delete');
    Route::post('medicos/{medico}/assinatura', [MedicoController::class, 'uploadAssinatura'])->middleware('permission:medicos.update');
    Route::delete('medicos/{medico}/assinatura', [MedicoController::class, 'deleteAssinatura'])->middleware('permission:medicos.update');
    Route::post('medicos/{medico}/carimbo', [MedicoController::class, 'uploadCarimbo'])->middleware('permission:medicos.update');
    Route::delete('medicos/{medico}/carimbo', [MedicoController::class, 'deleteCarimbo'])->middleware('permission:medicos.update');

    // CIDs
    Route::middleware('permission:cids.view')->group(function () {
        Route::get('cids', [CidController::class, 'index']);
        Route::get('cids/{cid}', [CidController::class, 'show']);
    });
    Route::post('cids', [CidController::class, 'store'])->middleware('permission:cids.create');
    Route::match(['put', 'patch'], 'cids/{cid}', [CidController::class, 'update'])->middleware('permission:cids.update');
    Route::delete('cids/{cid}', [CidController::class, 'destroy'])->middleware('permission:cids.delete');

    // Helper to register report-style resources with PDF
    foreach ([
        ['consultas', ConsultaController::class],
        ['exames', ExameController::class],
        ['atestados', AtestadoController::class],
        ['altas', AltaController::class],
        ['relatorios', RelatorioController::class],
    ] as [$name, $ctrl]) {
        Route::middleware("permission:{$name}.view")->group(function () use ($name, $ctrl) {
            Route::get($name, [$ctrl, 'index']);
            Route::get("{$name}/{".rtrim($name, 's')."}", [$ctrl, 'show']);
            Route::get("{$name}/{".rtrim($name, 's')."}/pdf", [$ctrl, 'pdf'])->middleware("permission:{$name}.pdf");
        });
        Route::post($name, [$ctrl, 'store'])->middleware("permission:{$name}.create");
        Route::match(['put', 'patch'], "{$name}/{".rtrim($name, 's')."}", [$ctrl, 'update'])->middleware("permission:{$name}.update");
        Route::delete("{$name}/{".rtrim($name, 's')."}", [$ctrl, 'destroy'])->middleware("permission:{$name}.delete");
    }

    // Validar assinatura (rascunho → emitido)
    Route::post('atestados/{atestado}/validar', [AtestadoController::class, 'validar'])->middleware('permission:atestados.update');
    Route::post('relatorios/{relatorio}/validar', [RelatorioController::class, 'validar'])->middleware('permission:relatorios.update');

    // Funcionários
    Route::middleware('permission:funcionarios.view')->group(function () {
        Route::get('funcionarios', [FuncionarioController::class, 'index']);
        Route::get('funcionarios/aniversariantes', [FuncionarioController::class, 'aniversariantes']);
        Route::get('funcionarios/{funcionario}', [FuncionarioController::class, 'show']);
    });
    Route::post('funcionarios', [FuncionarioController::class, 'store'])->middleware('permission:funcionarios.create');
    Route::match(['put', 'patch'], 'funcionarios/{funcionario}', [FuncionarioController::class, 'update'])->middleware('permission:funcionarios.update');
    Route::delete('funcionarios/{funcionario}', [FuncionarioController::class, 'destroy'])->middleware('permission:funcionarios.delete');

    // SMS
    Route::middleware('permission:sms.view')->group(function () {
        Route::get('sms', [SmsController::class, 'index']);
        Route::get('sms/stats', [SmsController::class, 'stats']);
        Route::get('sms/{sms}', [SmsController::class, 'show']);
    });
    Route::post('sms', [SmsController::class, 'store'])->middleware('permission:sms.send');
    Route::post('sms/bulk', [SmsController::class, 'storeBulk'])->middleware('permission:sms.bulk');
    Route::post('sms-pedido-saldo', [SmsController::class, 'requestBalance'])->middleware('permission:sms.send');
    Route::post('sms/{sms}/cancel', [SmsController::class, 'cancel'])->middleware('permission:sms.send');
    Route::post('sms/{sms}/resend', [SmsController::class, 'resend'])->middleware('permission:sms.send');
    Route::delete('sms/{sms}', [SmsController::class, 'destroy'])->middleware('permission:sms.send');

    // Departamentos + Serviços — leitura para autenticados, escrita admin
    Route::get('departamentos', [DepartamentoController::class, 'index']);
    Route::get('servicos', [ServicoController::class, 'index']);

    // Admin: users / roles / settings / departamentos / serviços
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('users-roles-list', [UserController::class, 'roles']);
        Route::post('users/{user}/approve', [UserController::class, 'approve']);
        Route::post('users/{user}/reject', [UserController::class, 'reject']);

        Route::get('roles', [RoleController::class, 'index']);
        Route::get('permissions', [RoleController::class, 'permissions']);
        Route::post('roles', [RoleController::class, 'store']);
        Route::match(['put', 'patch'], 'roles/{role}', [RoleController::class, 'update']);
        Route::delete('roles/{role}', [RoleController::class, 'destroy']);

        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);

        Route::post('departamentos', [DepartamentoController::class, 'store']);
        Route::match(['put', 'patch'], 'departamentos/{departamento}', [DepartamentoController::class, 'update']);
        Route::delete('departamentos/{departamento}', [DepartamentoController::class, 'destroy']);

        Route::post('servicos', [ServicoController::class, 'store']);
        Route::match(['put', 'patch'], 'servicos/{servico}', [ServicoController::class, 'update']);
        Route::delete('servicos/{servico}', [ServicoController::class, 'destroy']);
    });
});
