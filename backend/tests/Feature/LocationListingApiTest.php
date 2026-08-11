<?php

namespace Tests\Feature;

use App\Models\ApiClient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class LocationListingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLocationTables();
        $this->seedLocationHierarchy();
    }

    public function test_listing_requires_a_token(): void
    {
        $this->getJson('/api/v1/locations/provinces')->assertUnauthorized();
        $this->getJson('/api/v1/search')->assertUnauthorized();
        $this->getJson('/api/v1/duplicate-gn')->assertUnauthorized();

        // API clients such as Postman must receive JSON even when they omit
        // an explicit Accept: application/json header.
        $this->get('/api/v1/locations/provinces')
            ->assertUnauthorized()
            ->assertHeader('content-type', 'application/json');
    }

    public function test_guest_token_can_access_search_and_duplicate_analysis(): void
    {
        $token = $this->guestToken(['location:read']);

        $this->withToken($token)
            ->getJson('/api/v1/search?province_id=none')
            ->assertOk()
            ->assertJsonPath('data', []);

        $this->withToken($token)
            ->getJson('/api/v1/duplicate-gn')
            ->assertOk()
            ->assertJsonStructure(['data', 'summary']);
    }

    public function test_guest_token_can_read_every_listing_and_filter_children(): void
    {
        ApiClient::create(['name' => 'Public Website', 'slug' => 'public-web']);

        $tokenResponse = $this->postJson('/api/v1/auth/guest-token')
            ->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('abilities.0', 'location:read');

        $token = $tokenResponse->json('token');
        $headers = ['Authorization' => "Bearer {$token}"];

        $this->withHeaders($headers)->getJson('/api/v1/locations/provinces')
            ->assertOk()->assertJsonCount(2)->assertJsonPath('0.name_english', 'Central');
        $this->withHeaders($headers)->getJson('/api/v1/locations/districts?province_id=1')
            ->assertOk()->assertJsonCount(1)->assertJsonPath('0.name_english', 'Kandy');
        $this->withHeaders($headers)->getJson('/api/v1/locations/divisional-secretariats?district_id=1')
            ->assertOk()->assertJsonCount(1)->assertJsonPath('0.name_english', 'Kandy Four Gravets');
        $this->withHeaders($headers)->getJson('/api/v1/locations/gn-divisions?ds_id=1')
            ->assertOk()->assertJsonCount(1)->assertJsonPath('0.name_english', 'Ampitiya');
        $this->withHeaders($headers)->getJson('/api/v1/locations/villages?gn_id=1')
            ->assertOk()->assertJsonCount(1)->assertJsonPath('0.name_english', 'Ampitiya Village');

        $storedToken = PersonalAccessToken::findToken($token);
        $this->assertTrue($storedToken->can('location:read'));
        $this->assertTrue($storedToken->expires_at->between(now()->addMinutes(59), now()->addMinutes(61)));
    }

    public function test_invalid_parent_filter_returns_validation_error(): void
    {
        $token = $this->guestToken(['location:read']);

        $this->withToken($token)
            ->getJson('/api/v1/locations/districts?province_id=999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('province_id');
    }

    public function test_token_without_location_read_ability_is_forbidden(): void
    {
        $this->withToken($this->guestToken(['other:read']))
            ->getJson('/api/v1/locations/provinces')
            ->assertForbidden();
    }

    public function test_expired_and_revoked_tokens_are_unauthorized(): void
    {
        $client = ApiClient::create(['name' => 'Public Website', 'slug' => 'public-web']);
        $expired = $client->createToken('expired', ['location:read'], now()->subMinute())->plainTextToken;

        $this->withToken($expired)->getJson('/api/v1/locations/provinces')->assertUnauthorized();

        $revoked = $client->createToken('revoked', ['location:read'], now()->addHour())->plainTextToken;
        PersonalAccessToken::findToken($revoked)->delete();
        $this->withToken($revoked)->getJson('/api/v1/locations/provinces')->assertUnauthorized();
    }

    public function test_authenticated_login_token_can_read_listings_and_expires_in_eight_hours(): void
    {
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@example.test',
            'password' => Hash::make('secret-password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@example.test',
            'password' => 'secret-password',
        ])->assertOk();

        $token = $response->json('token');
        $this->withToken($token)->getJson('/api/v1/locations/provinces')->assertOk();

        $storedToken = PersonalAccessToken::findToken($token);
        $this->assertTrue($storedToken->can('location:read'));
        $this->assertTrue($storedToken->expires_at->between(now()->addMinutes(479), now()->addMinutes(481)));
    }

    private function guestToken(array $abilities): string
    {
        $client = ApiClient::firstOrCreate(
            ['slug' => 'public-web'],
            ['name' => 'Public Website', 'is_active' => true]
        );

        return $client->createToken('test', $abilities, now()->addHour())->plainTextToken;
    }

    private function createLocationTables(): void
    {
        Schema::create('province', function (Blueprint $table) {
            $table->id();
            $table->string('name_english');
            $table->string('name_sinhala')->nullable();
            $table->string('name_tamil')->nullable();
            $table->string('province_code');
            $table->string('lifecode');
        });
        Schema::create('district', function (Blueprint $table) {
            $table->id();
            $table->string('name_english');
            $table->string('name_sinhala')->nullable();
            $table->string('name_tamil')->nullable();
            $table->string('district_code');
            $table->string('lifecode');
            $table->unsignedBigInteger('province_id');
        });
        Schema::create('divisional_secretariat', function (Blueprint $table) {
            $table->id();
            $table->string('name_english');
            $table->string('name_sinhala')->nullable();
            $table->string('name_tamil')->nullable();
            $table->string('divisional_secretariat_code');
            $table->string('lifecode');
            $table->unsignedBigInteger('district_id');
        });
        Schema::create('grama_niladhari_division', function (Blueprint $table) {
            $table->id();
            $table->string('name_english');
            $table->string('name_sinhala')->nullable();
            $table->string('name_tamil')->nullable();
            $table->string('grama_niladhari_division_code');
            $table->string('lifecode');
            $table->string('mpa_code')->nullable();
            $table->unsignedBigInteger('divisional_secretariat_id');
        });
        Schema::create('village', function (Blueprint $table) {
            $table->id();
            $table->string('name_english');
            $table->string('name_sinhala')->nullable();
            $table->string('name_tamil')->nullable();
            $table->string('village_code');
            $table->string('lifecode');
            $table->unsignedBigInteger('grama_niladhari_division_id');
        });
    }

    private function seedLocationHierarchy(): void
    {
        DB::table('province')->insert([
            ['id' => 1, 'name_english' => 'Central', 'province_code' => '2', 'lifecode' => '2'],
            ['id' => 2, 'name_english' => 'Western', 'province_code' => '1', 'lifecode' => '1'],
        ]);
        DB::table('district')->insert([
            ['id' => 1, 'name_english' => 'Kandy', 'district_code' => '1', 'lifecode' => '2-1', 'province_id' => 1],
            ['id' => 2, 'name_english' => 'Colombo', 'district_code' => '1', 'lifecode' => '1-1', 'province_id' => 2],
        ]);
        DB::table('divisional_secretariat')->insert([
            ['id' => 1, 'name_english' => 'Kandy Four Gravets', 'divisional_secretariat_code' => '01', 'lifecode' => '2-1-01', 'district_id' => 1],
            ['id' => 2, 'name_english' => 'Colombo', 'divisional_secretariat_code' => '01', 'lifecode' => '1-1-01', 'district_id' => 2],
        ]);
        DB::table('grama_niladhari_division')->insert([
            ['id' => 1, 'name_english' => 'Ampitiya', 'grama_niladhari_division_code' => '100', 'lifecode' => '2-1-01-100', 'divisional_secretariat_id' => 1],
            ['id' => 2, 'name_english' => 'Fort', 'grama_niladhari_division_code' => '100', 'lifecode' => '1-1-01-100', 'divisional_secretariat_id' => 2],
        ]);
        DB::table('village')->insert([
            ['id' => 1, 'name_english' => 'Ampitiya Village', 'village_code' => '001', 'lifecode' => '2-1-01-100-001', 'grama_niladhari_division_id' => 1],
            ['id' => 2, 'name_english' => 'Fort Village', 'village_code' => '001', 'lifecode' => '1-1-01-100-001', 'grama_niladhari_division_id' => 2],
        ]);
    }
}
