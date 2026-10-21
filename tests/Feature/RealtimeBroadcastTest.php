<?php

namespace Tests\Feature;

use App\Events\AppSettingsUpdated;
use App\Events\TransactionRecorded;
use App\Models\Bill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RealtimeBroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_a_bill_notifies_the_owners_other_open_pages(): void
    {
        Event::fake([TransactionRecorded::class]);
        $user = User::factory()->create();
        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'WiFi Indihome',
            'amount' => 350000,
            'due_day' => 15,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        $this->actingAs($user)->delete('/tagihan/'.$bill->id)->assertRedirect();

        Event::assertDispatched(
            TransactionRecorded::class,
            fn (TransactionRecorded $event) => $event->userId === $user->id && $event->action === 'deleted'
        );
    }

    public function test_updating_app_settings_notifies_every_member(): void
    {
        Event::fake([AppSettingsUpdated::class]);
        $admin = User::factory()->create(['role' => 'superadmin']);

        $this->actingAs($admin)->post('/admin/settings', [
            'pro_monthly_price' => 25000,
            'pro_yearly_price' => 250000,
            'pro_plus_monthly_price' => 50000,
            'pro_plus_yearly_price' => 500000,
            'support_email' => 'support@example.com',
            'support_wa' => '6281234567890',
        ])->assertSessionHasNoErrors();

        Event::assertDispatched(AppSettingsUpdated::class);
    }

    public function test_resetting_plan_access_rules_notifies_every_member(): void
    {
        Event::fake([AppSettingsUpdated::class]);
        $admin = User::factory()->create(['role' => 'superadmin']);

        $this->actingAs($admin)->post('/admin/settings/reset-tier-rules')->assertRedirect();

        Event::assertDispatched(AppSettingsUpdated::class);
    }

    public function test_app_settings_broadcast_carries_no_data_on_its_public_channel(): void
    {
        $event = new AppSettingsUpdated;

        $this->assertSame('app-settings', $event->broadcastOn()[0]->name);
        $this->assertSame([], $event->broadcastWith());
    }

    public function test_deleting_a_user_notifies_that_users_open_pages(): void
    {
        Event::fake([TransactionRecorded::class]);
        $admin = User::factory()->create(['role' => 'superadmin']);
        $member = User::factory()->create();

        $this->actingAs($admin)->delete('/admin/users/'.$member->id)->assertRedirect();

        $this->assertModelMissing($member);
        Event::assertDispatched(
            TransactionRecorded::class,
            fn (TransactionRecorded $event) => $event->userId === $member->id && $event->action === 'account_deleted'
        );
    }
}
