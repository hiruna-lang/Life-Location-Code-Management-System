<?php

namespace App\Http\Controllers;

use App\Models\DivisionalSecretariat;
use App\Models\DsVerification;
use App\Models\GramaNiladhariDivision;
use App\Models\Village;
use App\Models\VerificationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VerificationController extends Controller
{
    /** Get GN divisions for the officer's assigned DS */
    public function myGnDivisions(Request $request)
    {
        $user = $request->user();
        $dsId = $this->getOfficerDsId($user);

        if (!$dsId) {
            return response()->json(['message' => 'No DS division assigned.'], 403);
        }

        $ds = DivisionalSecretariat::find($dsId);

        $gns = GramaNiladhariDivision::where('divisional_secretariat_id', $dsId)
            ->with(['villages' => function ($query) {
                $query->orderBy('name_english');
            }])
            ->orderBy('name_english')
            ->get();

        $verification = DsVerification::firstOrCreate(
            ['divisional_secretariat_id' => $dsId],
            ['status' => 'pending']
        );

        return response()->json([
            'ds_id'        => $dsId,
            'ds_name'      => $ds?->name_english,
            'gn_divisions' => $gns,
            'gn_count'     => $gns->count(),
            'village_count'=> $gns->sum(fn ($gn) => $gn->villages->count()),
            'status'       => $verification->status,
        ]);
    }

    /** Get villages for a GN (only if officer owns that DS) */
    public function gnVillages(Request $request, $gnId)
    {
        $user = $request->user();
        $dsId = $this->getOfficerDsId($user);

        $gn = GramaNiladhariDivision::findOrFail($gnId);

        if (!$user->isAdmin() && $gn->divisional_secretariat_id != $dsId) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        return response()->json(Village::where('grama_niladhari_division_id', $gnId)->orderBy('name_english')->get());
    }

    /** Update a GN division */
    public function updateGn(Request $request, $gnId)
    {
        $user = $request->user();
        $dsId = $this->getOfficerDsId($user);

        $gn = GramaNiladhariDivision::findOrFail($gnId);

        if (!$user->isAdmin() && $gn->divisional_secretariat_id != $dsId) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $this->checkNotLocked($gn->divisional_secretariat_id, $user);

        $old = $gn->toArray();

        $gn->update($request->only([
            'name_english', 'name_sinhala', 'name_tamil',
            'grama_niladhari_division_code', 'lifecode', 'mpa_code'
        ]));

        VerificationLog::create([
            'user_id'                    => $user->id,
            'divisional_secretariat_id'  => $gn->divisional_secretariat_id,
            'action'                     => 'edit_gn',
            'description'                => "Updated GN: {$gn->name_english}",
            'old_data'                   => $old,
            'new_data'                   => $gn->fresh()->toArray(),
            'ip_address'                 => $request->ip(),
        ]);

        return response()->json(['message' => 'GN Division updated.', 'gn' => $gn->fresh()]);
    }

    /** Update a village */
    public function updateVillage(Request $request, $villageId)
    {
        $user    = $request->user();
        $dsId    = $this->getOfficerDsId($user);
        $village = Village::with('gramaNiladhariDivision')->findOrFail($villageId);
        $gnDsId  = $village->gramaNiladhariDivision->divisional_secretariat_id;

        if (!$user->isAdmin() && $gnDsId != $dsId) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $this->checkNotLocked($gnDsId, $user);

        $old = $village->toArray();

        $village->update($request->only([
            'name_english', 'name_sinhala', 'name_tamil', 'village_code', 'lifecode'
        ]));

        VerificationLog::create([
            'user_id'                    => $user->id,
            'divisional_secretariat_id'  => $gnDsId,
            'action'                     => 'edit_village',
            'description'                => "Updated Village: {$village->name_english}",
            'old_data'                   => $old,
            'new_data'                   => $village->fresh()->toArray(),
            'ip_address'                 => $request->ip(),
        ]);

        return response()->json(['message' => 'Village updated.', 'village' => $village->fresh()]);
    }

    /** Mark as draft */
    public function markDraft(Request $request)
    {
        $user = $request->user();
        $dsId = $this->getOfficerDsId($user);
        $this->checkNotLocked($dsId, $user);

        $verification = DsVerification::firstOrCreate(['divisional_secretariat_id' => $dsId]);
        $verification->update(['status' => 'draft', 'verified_by' => $user->id, 'draft_at' => now()]);

        VerificationLog::create([
            'user_id' => $user->id, 'divisional_secretariat_id' => $dsId,
            'action' => 'draft', 'description' => 'Marked as Draft', 'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Marked as Draft.', 'status' => 'draft']);
    }

    /** Mark as final */
    public function markFinal(Request $request)
    {
        $user = $request->user();
        $dsId = $this->getOfficerDsId($user);
        $this->checkNotLocked($dsId, $user);

        $verification = DsVerification::firstOrCreate(['divisional_secretariat_id' => $dsId]);
        $verification->update(['status' => 'final', 'verified_by' => $user->id, 'final_at' => now()]);

        VerificationLog::create([
            'user_id' => $user->id, 'divisional_secretariat_id' => $dsId,
            'action' => 'final', 'description' => 'Marked as Final (Verified)', 'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Marked as Final.', 'status' => 'final']);
    }

    /** Admin: lock a DS */
    public function lockDs(Request $request, $dsId)
    {
        $this->requireAdmin($request->user());
        $verification = DsVerification::firstOrCreate(['divisional_secretariat_id' => $dsId]);
        $verification->update(['status' => 'locked', 'locked_by' => $request->user()->id, 'locked_at' => now()]);

        VerificationLog::create([
            'user_id' => $request->user()->id, 'divisional_secretariat_id' => $dsId,
            'action' => 'lock', 'description' => 'DS Division Locked by Admin', 'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'DS locked.']);
    }

    /** Admin: unlock a DS */
    public function unlockDs(Request $request, $dsId)
    {
        $this->requireAdmin($request->user());
        $verification = DsVerification::where('divisional_secretariat_id', $dsId)->first();
        if ($verification) {
            $verification->update(['status' => 'final', 'locked_by' => null, 'locked_at' => null]);
        }

        VerificationLog::create([
            'user_id' => $request->user()->id, 'divisional_secretariat_id' => $dsId,
            'action' => 'unlock', 'description' => 'DS Division Unlocked by Admin', 'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'DS unlocked.']);
    }

    private function getOfficerDsId($user): ?int
    {
        if ($user->isAdmin()) return null;
        return $user->activeDsAssignment()?->value('divisional_secretariat_id');
    }

    private function checkNotLocked(int $dsId, $user): void
    {
        if ($user->isAdmin()) return;
        $v = DsVerification::where('divisional_secretariat_id', $dsId)->first();
        if ($v && $v->status === 'locked') {
            abort(403, 'DS division is locked. Contact admin to unlock.');
        }
    }

    private function requireAdmin($user): void
    {
        if (!$user->isAdmin()) abort(403, 'Admin access required.');
    }
}
