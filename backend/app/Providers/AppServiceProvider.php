<?php

namespace App\Providers;

use App\Models\InstanceStep;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Policies\DecisionPolicy;
use App\Policies\WorkflowDefinitionPolicy;
use App\Policies\WorkflowInstancePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(WorkflowDefinition::class, WorkflowDefinitionPolicy::class);
        Gate::policy(WorkflowInstance::class, WorkflowInstancePolicy::class);
        Gate::policy(InstanceStep::class, DecisionPolicy::class);
    }
}
