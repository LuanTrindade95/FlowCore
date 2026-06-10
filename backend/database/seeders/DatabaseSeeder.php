<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RbacSeeder::class);

        User::firstOrCreate(
            ['email' => 'admin@demo.com'],
            ['name' => 'Admin Demo', 'password' => 'password']
        )->assignRole('admin');

        User::firstOrCreate(
            ['email' => 'approver@demo.com'],
            ['name' => 'Aprovador Demo', 'password' => 'password']
        )->assignRole('approver');

        User::firstOrCreate(
            ['email' => 'requester@demo.com'],
            ['name' => 'Solicitante Demo', 'password' => 'password']
        )->assignRole('requester');

        User::factory(7)->create()->each(fn (User $user) => $user->assignRole(fake()->randomElement([
            'approver',
            'requester',
        ])));

        $this->call(DemoWorkflowSeeder::class);
    }
}
