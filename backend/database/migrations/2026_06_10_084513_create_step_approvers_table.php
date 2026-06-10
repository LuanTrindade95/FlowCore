<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('step_approvers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_step_id')->constrained()->cascadeOnDelete();
            $table->string('assignee_type', 32);
            $table->string('assignee_ref');
            $table->string('approval_mode', 24)->default('any');
            $table->unsignedInteger('quorum_n')->nullable();
            $table->timestamps();

            $table->index(['workflow_step_id', 'assignee_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('step_approvers');
    }
};
