<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect([
            'workflows.manage',
            'requests.create',
            'requests.decide',
            'requests.view-all',
        ])->mapWithKeys(fn (string $name) => [
            $name => Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']),
        ]);

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $approver = Role::firstOrCreate(['name' => 'approver', 'guard_name' => 'web']);
        $requester = Role::firstOrCreate(['name' => 'requester', 'guard_name' => 'web']);

        $admin->syncPermissions($permissions->values());
        $approver->syncPermissions([
            $permissions['requests.decide'],
            $permissions['requests.view-all'],
        ]);
        $requester->syncPermissions([
            $permissions['requests.create'],
        ]);
    }
}
