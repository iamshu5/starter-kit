<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->nullable()->after('name');
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete()->after('username')->index();
            $table->boolean('is_active')->default(true)->after('role_id')->index();

            $table->fullText(['name', 'username', 'email'], 'users_fulltext_search');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropFullText('users_fulltext_search');
            $table->dropForeign(['role_id']);
            $table->dropColumn(['username', 'role_id', 'is_active']);
        });
    }
};
