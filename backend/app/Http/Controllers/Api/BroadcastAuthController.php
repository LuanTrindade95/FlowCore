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

        // routes/channels.php only registers channel authorizers on the app's
        // default broadcast connection, but this controller always resolves
        // the "reverb" connection explicitly. Registering the authorizer here
        // (instead of eagerly in routes/channels.php) keeps the "reverb"
        // broadcaster/Pusher client construction deferred until an actual
        // broadcasting-auth request is handled, so booting the app (artisan
        // commands, composer install, Docker image builds) never requires
        // REVERB_APP_ID/KEY/SECRET to be configured.
        Broadcast::connection('reverb')->channel(
            'users.{id}.runtime',
            fn ($channelUser, $id) => (int) $channelUser->id === (int) $id,
        );

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
