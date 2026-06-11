<?php

namespace App\Events;

use App\Domain\Workflow\Enums\WorkflowActionType;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RuntimeWorkflowUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public bool $afterCommit = true;

    /**
     * @param  list<int>  $recipientUserIds
     */
    public function __construct(
        public readonly array $recipientUserIds,
        public readonly int $workflowInstanceId,
        public readonly ?int $instanceStepId,
        public readonly WorkflowActionType $action,
    ) {}

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return array_map(
            fn (int $userId): PrivateChannel => new PrivateChannel("users.{$userId}.runtime"),
            $this->recipientUserIds
        );
    }

    public function broadcastAs(): string
    {
        return 'runtime.workflow.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'workflow_instance_id' => $this->workflowInstanceId,
            'instance_step_id' => $this->instanceStepId,
            'action' => $this->action->value,
            'occurred_at' => now()->toISOString(),
        ];
    }
}
