<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RbacSeeder::class);

        $this->demoUser('Admin Demo', 'admin@demo.com', 'admin');
        $this->demoUser('Aprovador Demo', 'approver@demo.com', 'approver');
        $this->demoUser('Solicitante Demo', 'requester@demo.com', 'requester');

        $this->demoUser('Marina Financeiro', 'marina.financeiro@demo.com', 'approver');
        $this->demoUser('Rafael Operacoes', 'rafael.operacoes@demo.com', 'approver');
        $this->demoUser('Bianca RH', 'bianca.rh@demo.com', 'approver');
        $this->demoUser('Caio Tecnologia', 'caio.tecnologia@demo.com', 'requester');
        $this->demoUser('Nadia Produto', 'nadia.produto@demo.com', 'requester');
        $this->demoUser('Otavio Compras', 'otavio.compras@demo.com', 'requester');
        $this->demoUser('Helena Juridico', 'helena.juridico@demo.com', 'approver');

        $this->call(DemoWorkflowSeeder::class);
    }

    private function demoUser(string $name, string $email, string $role): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => 'password']
        );

        $user->syncRoles([$role]);

        return $user;
    }
}
