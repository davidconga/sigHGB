<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public const RESOURCES = [
        'pacientes', 'medicos', 'consultas', 'exames',
        'atestados', 'altas', 'relatorios', 'cids',
    ];

    public const ACTIONS = ['view', 'create', 'update', 'delete', 'pdf'];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::RESOURCES as $resource) {
            foreach (self::ACTIONS as $action) {
                if ($action === 'pdf' && in_array($resource, ['pacientes', 'medicos', 'cids'], true)) {
                    continue;
                }
                Permission::findOrCreate("{$resource}.{$action}");
            }
        }

        Permission::findOrCreate('users.manage');
        Permission::findOrCreate('settings.manage');
        Permission::findOrCreate('roles.manage');
        Permission::findOrCreate('sms.view');
        Permission::findOrCreate('sms.send');
        Permission::findOrCreate('sms.bulk');
        foreach (['view', 'create', 'update', 'delete'] as $a) {
            Permission::findOrCreate("funcionarios.{$a}");
        }

        $admin = Role::findOrCreate('admin');
        $admin->syncPermissions(Permission::all());

        $medico = Role::findOrCreate('medico');
        $medicoPerms = [];
        foreach (['pacientes', 'consultas', 'exames', 'atestados', 'altas', 'relatorios'] as $r) {
            $medicoPerms[] = "{$r}.view";
            $medicoPerms[] = "{$r}.create";
            $medicoPerms[] = "{$r}.update";
            if (! in_array($r, ['pacientes'], true)) {
                $medicoPerms[] = "{$r}.pdf";
            }
        }
        $medicoPerms[] = 'medicos.view';
        $medicoPerms[] = 'cids.view';
        $medicoPerms[] = 'sms.view';
        $medicoPerms[] = 'sms.send';
        $medico->syncPermissions($medicoPerms);

        $recep = Role::findOrCreate('recepcionista');
        $recep->syncPermissions([
            'pacientes.view', 'pacientes.create', 'pacientes.update',
            'medicos.view',
            'consultas.view', 'consultas.pdf',
            'atestados.view', 'atestados.pdf',
            'relatorios.view', 'relatorios.pdf',
            'altas.view', 'altas.pdf',
            'exames.view', 'exames.pdf',
            'cids.view',
            'sms.view', 'sms.send', 'sms.bulk',
            'funcionarios.view', 'funcionarios.create', 'funcionarios.update',
        ]);
    }
}
