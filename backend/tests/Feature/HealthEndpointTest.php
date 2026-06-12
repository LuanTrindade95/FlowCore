<?php

it('exposes a lightweight health endpoint for platform checks', function () {
    $this->getJson('/health')
        ->assertOk()
        ->assertExactJson([
            'status' => 'ok',
            'service' => 'flowcore-api',
        ]);
});
