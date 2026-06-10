<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('issues a Sanctum token for valid credentials', function () {
    $this->seed(DatabaseSeeder::class);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@demo.com',
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Login realizado com sucesso.')
        ->assertJsonPath('token_type', 'Bearer')
        ->assertJsonPath('user.email', 'admin@demo.com')
        ->assertJson(fn ($json) => $json
            ->has('access_token')
            ->has('user.roles')
            ->has('user.permissions')
            ->etc()
        );
});

it('rejects invalid credentials with 401', function () {
    $this->seed(DatabaseSeeder::class);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@demo.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401)
        ->assertJsonPath('code', 'INVALID_CREDENTIALS');
});

it('returns the authenticated user with roles and permissions', function () {
    $this->seed(DatabaseSeeder::class);
    $admin = User::where('email', 'admin@demo.com')->firstOrFail();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/v1/auth/me');

    $response->assertOk()
        ->assertJsonPath('data.email', 'admin@demo.com')
        ->assertJsonPath('data.roles.0', 'admin')
        ->assertJson(fn ($json) => $json->has('data.permissions'));
});

it('requires a token for protected routes', function () {
    $response = $this->getJson('/api/v1/auth/me');

    $response->assertUnauthorized()
        ->assertJsonPath('code', 'UNAUTHENTICATED');
});

it('returns 403 when an authenticated user lacks permission middleware access', function () {
    $this->seed(DatabaseSeeder::class);
    $requester = User::where('email', 'requester@demo.com')->firstOrFail();
    $token = $requester->createToken('test')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/v1/authorization/workflows-manage-smoke');

    $response->assertForbidden()
        ->assertJsonPath('code', 'FORBIDDEN');
});
