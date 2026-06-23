<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_access_logs', function (Blueprint $table) {
            $table->id();
            $table->string('endpoint');
            $table->string('method', 10);
            $table->string('ip_address', 45)->nullable();
            $table->text('query_params')->nullable();
            $table->integer('response_code')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamp('accessed_at')->useCurrent();
            $table->index('accessed_at');
            $table->index('endpoint');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_access_logs');
    }
};
