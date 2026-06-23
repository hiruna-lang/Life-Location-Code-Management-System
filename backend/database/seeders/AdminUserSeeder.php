<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@llcms.lk'],
            [
                'name'      => 'System Administrator',
                'email'     => 'admin@llcms.lk',
                'password'  => Hash::make('Admin@1234'),
                'role'      => 'admin',
                'is_active' => true,
            ]
        );

        $this->command->info('Admin user created: admin@llcms.lk / Admin@1234');
    }
}
