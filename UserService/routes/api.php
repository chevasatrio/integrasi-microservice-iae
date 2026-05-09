<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::apiResource('users', UserController::class);
Route::get('users/{id}/orders', [UserController::class, 'orderHistory']);
