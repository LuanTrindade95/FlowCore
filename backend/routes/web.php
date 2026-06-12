<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'service' => 'flowcore-api',
]));

Route::get('/', function () {
    return view('welcome');
});
