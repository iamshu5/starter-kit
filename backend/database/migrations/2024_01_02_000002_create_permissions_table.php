<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
            $table->index('created_at');
            $table->fullText(['name', 'slug'], 'permissions_fulltext_search');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
