<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('menus')->nullOnDelete()->index();
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->text('icon')->nullable();
            $table->string('route')->nullable();
            $table->integer('order')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->index('created_at');
            $table->fullText(['name', 'slug', 'route'], 'menus_fulltext_search');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
