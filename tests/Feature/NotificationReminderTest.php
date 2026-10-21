<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Target;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Set fixed test time: 2026-10-19
        Carbon::setTestNow(Carbon::create(2026, 10, 19, 10, 0, 0));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow(null);
        parent::tearDown();
    }

    public function test_unpaid_bills_due_or_overdue_generate_reminders(): void
    {
        $user = User::factory()->create();

        // Overdue bill (due day 10, today is 19 -> 9 days overdue)
        Bill::create([
            'user_id' => $user->id,
            'name' => 'Listrik PLN',
            'amount' => 150000,
            'due_day' => 10,
            'is_active' => true,
        ]);

        // Upcoming bill (due day 22 -> 3 days away)
        Bill::create([
            'user_id' => $user->id,
            'name' => 'Internet Rumah',
            'amount' => 350000,
            'due_day' => 22,
            'reminder_days' => 5,
            'is_active' => true,
        ]);

        $reminders = NotificationService::getRemindersForUser($user);

        $this->assertEquals(2, $reminders['bills_count']);
        $this->assertGreaterThanOrEqual(2, $reminders['urgent_count']);

        $billNames = array_column($reminders['bills'], 'title');
        $this->assertContains('Listrik PLN', $billNames);
        $this->assertContains('Internet Rumah', $billNames);

        $plnReminder = collect($reminders['bills'])->firstWhere('title', 'Listrik PLN');
        $this->assertEquals('terlambat', $plnReminder['status']);
        $this->assertEquals('danger', $plnReminder['urgency']);
        $this->assertStringContainsString('Terlambat 9 hari', $plnReminder['status_label']);
    }

    public function test_paid_bills_for_current_month_are_excluded_from_reminders(): void
    {
        $user = User::factory()->create();

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'Asuransi',
            'amount' => 500000,
            'due_day' => 15,
            'is_active' => true,
        ]);

        // Record full payment for October 2026
        BillPayment::create([
            'bill_id' => $bill->id,
            'user_id' => $user->id,
            'amount' => 500000,
            'month' => '2026-10',
            'paid_at' => '2026-10-14',
            'payment_method' => 'Transfer Bank',
        ]);

        $reminders = NotificationService::getRemindersForUser($user);

        $this->assertEquals(0, $reminders['bills_count']);
        $this->assertEmpty($reminders['bills']);
    }

    public function test_targets_with_due_dates_generate_reminders(): void
    {
        $user = User::factory()->create();

        // Target ending on 2026-10-25 (6 days away)
        Target::create([
            'user_id' => $user->id,
            'name' => 'Beli Laptop Baru',
            'category' => 'Elektronik',
            'target_amount' => 15000000,
            'current_amount' => 5000000,
            'target_date' => '2026-10-25',
            'status' => 'Berjalan',
        ]);

        // Already achieved target
        Target::create([
            'user_id' => $user->id,
            'name' => 'Dana Liburan',
            'category' => 'Hiburan',
            'target_amount' => 3000000,
            'current_amount' => 3000000,
            'target_date' => '2026-10-22',
            'status' => 'Tercapai',
        ]);

        $reminders = NotificationService::getRemindersForUser($user);

        $this->assertEquals(1, $reminders['targets_count']);
        $targetReminder = $reminders['targets'][0];
        $this->assertEquals('Beli Laptop Baru', $targetReminder['title']);
        $this->assertEquals('segera', $targetReminder['status']);
        $this->assertEquals(33, $targetReminder['progress']);
        $this->assertEquals(6, $targetReminder['diff_days']);
    }

    public function test_notifications_are_shared_in_inertia_props_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        Bill::create([
            'user_id' => $user->id,
            'name' => 'Air PDAM',
            'amount' => 80000,
            'due_day' => 19, // Today!
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->get(route('profile.edit'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->has('notifications')
            ->where('notifications.urgent_count', 1)
            ->where('notifications.bills.0.title', 'Air PDAM')
            ->where('notifications.bills.0.status', 'hari_ini')
        );
    }

    public function test_targets_are_reminded_from_thirty_days_before_and_after_the_target_date_passes(): void
    {
        $user = User::factory()->create();
        $targetDefaults = [
            'user_id' => $user->id,
            'category' => 'Properti',
            'target_amount' => 140000000,
            'current_amount' => 10000000,
            'status' => 'Berjalan',
        ];

        Target::create([...$targetDefaults, 'name' => 'Hari Ini', 'target_date' => '2026-10-19']);
        Target::create([...$targetDefaults, 'name' => 'Tepat H-30', 'target_date' => '2026-11-18']);
        Target::create([...$targetDefaults, 'name' => 'H-31', 'target_date' => '2026-11-19']);
        Target::create([...$targetDefaults, 'name' => 'Beli Rumah Tahun Depan', 'target_date' => '2027-10-19']);
        Target::create([...$targetDefaults, 'name' => 'Sudah Lewat', 'target_date' => '2026-10-18']);
        Target::create([...$targetDefaults, 'name' => 'Sudah Terkumpul', 'target_date' => '2026-10-25', 'current_amount' => 140000000]);

        $reminders = NotificationService::getRemindersForUser($user);

        $this->assertSame(['Sudah Lewat', 'Hari Ini', 'Tepat H-30'], array_column($reminders['all'], 'title'));
        $this->assertSame(['terlambat', 'hari_ini', 'mendatang'], array_column($reminders['all'], 'status'));
        $this->assertSame(3, $reminders['targets_count']);
    }
}
