<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="icon" type="image/png" href="/favicon.png">

        <!-- PWA Manifest & Mobile Web App Meta -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#009bd2">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="FinanceTrack">
        <link rel="apple-touch-icon" href="/favicon.png">

        <!-- Register Service Worker & Early PWA Install Prompt Capture -->
        <script>
            window.deferredPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.deferredPrompt = e;
                window.dispatchEvent(new Event('pwa-prompt-available'));
            });

            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                        console.warn('SW registration failed:', err);
                    });
                });
            }
        </script>

        <!-- Fonts: loaded without blocking the first paint (text shows in the fallback font until Figtree arrives) -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link rel="preload" as="style" href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" /></noscript>

        @if (($page['component'] ?? null) === 'Welcome')
            <!-- Mobile splash screen: pure CSS so it paints before the JS bundle loads -->
            <link rel="preload" as="image" href="/logo.png">
            <style>
                #app-splash {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%);
                    font-family: Figtree, ui-sans-serif, system-ui, -apple-system, sans-serif;
                    transition: opacity 0.6s ease, transform 0.6s ease;
                }
                @media (max-width: 767px) {
                    #app-splash { display: flex; }
                }
                #app-splash.is-leaving {
                    opacity: 0;
                    transform: scale(1.04);
                    pointer-events: none;
                }
                .app-splash__logo-wrap {
                    position: relative;
                    width: 96px;
                    height: 96px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .app-splash__ring {
                    position: absolute;
                    inset: 0;
                    border-radius: 9999px;
                    background: rgba(0, 155, 210, 0.14);
                    opacity: 0;
                    animation: appSplashRing 2.2s cubic-bezier(0.16, 1, 0.3, 1) 1s infinite;
                }
                .app-splash__logo {
                    position: relative;
                    width: 84px;
                    height: 84px;
                    object-fit: contain;
                    opacity: 0;
                    animation:
                        appSplashLogoIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                        appSplashFloat 2.4s ease-in-out 1.2s infinite;
                }
                .app-splash__name {
                    margin-top: 20px;
                    font-size: 26px;
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    color: #0f172a;
                    opacity: 0;
                    animation: appSplashFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
                }
                .app-splash__tagline {
                    margin-top: 4px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #64748b;
                    opacity: 0;
                    animation: appSplashFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards;
                }
                .app-splash__bar {
                    position: absolute;
                    bottom: calc(56px + env(safe-area-inset-bottom));
                    width: 112px;
                    height: 4px;
                    border-radius: 9999px;
                    background: #e2e8f0;
                    overflow: hidden;
                    opacity: 0;
                    animation: appSplashFadeUp 0.5s ease 1.2s forwards;
                }
                .app-splash__bar::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    width: 45%;
                    border-radius: inherit;
                    background: linear-gradient(90deg, #22d3ee, #009bd2, #1d6fd1);
                    animation: appSplashBar 1.6s ease-in-out infinite;
                }
                @keyframes appSplashLogoIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.6) rotate(-8deg); }
                    to { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
                }
                @keyframes appSplashFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes appSplashRing {
                    0% { opacity: 0.9; transform: scale(0.7); }
                    100% { opacity: 0; transform: scale(1.7); }
                }
                @keyframes appSplashFadeUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes appSplashBar {
                    0% { transform: translateX(-110%); }
                    100% { transform: translateX(250%); }
                }
                @media (prefers-reduced-motion: reduce) {
                    #app-splash *, #app-splash *::after { animation-duration: 0.01s !important; animation-iteration-count: 1 !important; }
                }
            </style>
        @endif

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @if (($page['component'] ?? null) === 'Welcome')
            <div id="app-splash" aria-hidden="true">
                <div class="app-splash__logo-wrap">
                    <span class="app-splash__ring"></span>
                    <img src="/logo.png" alt="" class="app-splash__logo">
                </div>
                <div class="app-splash__name">FinanceTrack</div>
                <div class="app-splash__tagline">Smart Personal Finance</div>
                <div class="app-splash__bar"></div>
            </div>

            <!-- Shown once per session on mobile; hides when React has mounted and the intro has played -->
            <script>
                (function () {
                    var splash = document.getElementById('app-splash');
                    var minimumVisibleMs = 2800;
                    var maximumVisibleMs = 6500;
                    var startedAt = Date.now();
                    var isAppReady = false;
                    var isHidden = false;

                    var alreadyShown = false;
                    try {
                        alreadyShown = sessionStorage.getItem('ft-splash-shown') === '1';
                        sessionStorage.setItem('ft-splash-shown', '1');
                    } catch (e) {}

                    if (alreadyShown || !window.matchMedia('(max-width: 767px)').matches) {
                        splash.remove();
                        window.hideSplashScreen = function () {};
                        return;
                    }

                    function hide() {
                        if (isHidden) return;
                        isHidden = true;
                        splash.classList.add('is-leaving');
                        setTimeout(function () { splash.remove(); }, 600);
                    }

                    window.hideSplashScreen = function () {
                        if (isAppReady) return;
                        isAppReady = true;
                        setTimeout(hide, Math.max(0, minimumVisibleMs - (Date.now() - startedAt)));
                    };

                    setTimeout(hide, maximumVisibleMs);
                })();
            </script>
        @endif

        @inertia
    </body>
</html>
