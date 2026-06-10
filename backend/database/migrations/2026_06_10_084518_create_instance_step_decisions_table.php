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
        Schema::create('instance_step_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instance_step_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('decision', 24);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['instance_step_id', 'actor_id']);
            $table->index(['actor_id', 'decision']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instance_step_decisions');
    }
};
