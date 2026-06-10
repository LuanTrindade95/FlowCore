<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InstanceStep;
use App\Models\WorkflowInstance;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class RuntimeDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        Gate::authorize('viewAny', WorkflowInstance::class);

        $user = request()->user();
        $visibleInstances = WorkflowInstance::query()->visibleTo($user);
        $openStatuses = ['pending', 'in_progress', 'escalated'];
        $terminalStatuses = ['approved', 'rejected', 'completed'];
        $lastThirtyDays = now()->subDays(30);

        $pending = InstanceStep::query()
            ->whereHas('instance', fn ($query) => $query->visibleTo($user))
            ->whereIn('status', $openStatuses)
            ->count();

        $overdue = InstanceStep::query()
            ->whereHas('instance', fn ($query) => $query->visibleTo($user))
            ->whereIn('status', $openStatuses)
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->count();

        $startedLastThirtyDays = (clone $visibleInstances)
            ->where('started_at', '>=', $lastThirtyDays)
            ->count();
        $completedLastThirtyDays = (clone $visibleInstances)
            ->where('started_at', '>=', $lastThirtyDays)
            ->whereIn('status', $terminalStatuses)
            ->count();

        $workflowBreakdown = WorkflowInstance::query()
            ->visibleTo($user)
            ->selectRaw('workflow_definition_id, count(*) as total')
            ->with('definition:id,name')
            ->groupBy('workflow_definition_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn (WorkflowInstance $instance) => [
                'workflow_definition_id' => $instance->workflow_definition_id,
                'name' => $instance->definition?->name ?? 'Workflow removido',
                'total' => (int) $instance->getAttribute('total'),
            ])
            ->values();

        return response()->json([
            'pending' => $pending,
            'overdue' => $overdue,
            'active' => (clone $visibleInstances)->where('status', 'running')->count(),
            'completed_last_30_days' => $completedLastThirtyDays,
            'throughput_percent' => $startedLastThirtyDays > 0
                ? round(($completedLastThirtyDays / $startedLastThirtyDays) * 100, 1)
                : 0,
            'workflow_breakdown' => $workflowBreakdown,
        ]);
    }
}
