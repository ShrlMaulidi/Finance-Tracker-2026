<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SplashScreenTest extends TestCase
{
    use RefreshDatabase;

    public function test_landing_page_renders_the_splash_screen(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('id="app-splash"', false);
    }

    public function test_other_pages_do_not_render_the_splash_screen(): void
    {
        $response = $this->get(route('login'));

        $response->assertOk();
        $response->assertDontSee('id="app-splash"', false);
    }
}
