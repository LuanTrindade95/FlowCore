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
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_definition_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->string('name');
            $table->string('type', 32);
            $table->unsignedInteger('order')->default(0);
            $table->json('config')->nullable();
            $table->unsignedInteger('sla_hours')->nullable();
            $table->boolean('is_start')->default(false);
            $table->timestamps();

            $table->unique(['workflow_definition_id', 'key']);
            $table->index(['workflow_definition_id', 'is_start']);
            $table->index(['workflow_definition_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
    }
};
