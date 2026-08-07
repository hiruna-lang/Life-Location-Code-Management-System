<?php

namespace Database\Seeders;

use App\Models\ApiClient;
use Illuminate\Database\Seeder;

class ApiClientSeeder extends Seeder
{
    public function run(): void
    {
        ApiClient::updateOrCreate(
            ['slug' => 'public-web'],
            ['name' => 'Public Website', 'is_active' => true]
        );
    }
}
