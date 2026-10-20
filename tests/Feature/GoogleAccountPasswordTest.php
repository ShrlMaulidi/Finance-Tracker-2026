<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GoogleAccountPasswordTest extends TestCase
{
    use RefreshDatabase;

    private function createGoogleUser(): User
    {
        return User::factory()->create(['password' => null, 'google_id' => 'google-123']);
    }

    public function test_google_user_can_create_a_password_without_a_current_password(): void
    {
        $user = $this->createGoogleUser();

        $this->actingAs($user)
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page->where('auth.user.has_password', false));

        $this->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'password' => 'password-baru-123',
                'password_confirmation' => 'password-baru-123',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertTrue(Hash::check('password-baru-123', $user->refresh()->password));
        $this->assertTrue($user->has_password);
    }

    public function test_user_with_a_password_must_still_confirm_the_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'password' => 'password-baru-123',
                'password_confirmation' => 'password-baru-123',
            ])
            ->assertSessionHasErrors('current_password');
    }

    public function test_google_user_can_delete_account_by_typing_hapus(): void
    {
        $user = $this->createGoogleUser();

        $this->actingAs($user)
            ->delete('/profile', ['confirmation' => ' hapus '])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_google_user_account_is_kept_when_confirmation_is_wrong(): void
    {
        $user = $this->createGoogleUser();

        $this->actingAs($user)
            ->from('/profile')
            ->delete('/profile', ['confirmation' => 'iya'])
            ->assertSessionHasErrors('confirmation')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
