<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Symfony\Component\HttpFoundation\Response;

class BroadcastAuthController
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $request->setUserResolver(fn () => $user);
        $response = Broadcast::connection('reverb')->auth($request);

        if (is_array($response) && array_key_exists('auth', $response)) {
            return response()->json($response);
        }

        $payload = Broadcast::connection('reverb')
            ->getPusher()
            ->authorizeChannel($request->string('channel_name')->toString(), $request->string('socket_id')->toString());

        return response($payload, Response::HTTP_OK, ['Content-Type' => 'application/json']);
    }
}
