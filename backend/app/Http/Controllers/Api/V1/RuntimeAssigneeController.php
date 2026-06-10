<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserSummaryResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RuntimeAssigneeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        abort_unless(request()->user()?->can('requests.decide'), 403);

        return UserSummaryResource::collection(
            User::permission('requests.decide')->orderBy('name')->get()
        );
    }
}
