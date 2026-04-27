<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\MsKelompokRiset;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        $researchGroups = MsKelompokRiset::query()
            ->select(['id', 'kelompok_riset'])
            ->orderBy('kelompok_riset')
            ->get();

        return Inertia::render('auth/register', [
            'researchGroups' => $researchGroups
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'research_group' => 'nullable|uuid|exists:ms_kelompok_riset,id',
            'google_scholar_id' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'research_group' => $request->research_group,
            'google_scholar_id' => $request->google_scholar_id,
        ]);

        event(new Registered($user));

        return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan.');
    }
}
