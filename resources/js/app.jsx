import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const pages = import.meta.glob('./Pages/**/*.jsx');

/**
 * Download the remaining page chunks once the browser is idle, so later menu
 * navigation stays instant without making the first load heavier.
 * Admin pages are left out; they load on demand for super admins only.
 */
function warmUpPageChunks() {
    const preload = () => {
        Object.entries(pages)
            .filter(([path]) => !path.startsWith('./Pages/Admin/'))
            .forEach(([, load]) => load().catch(() => {}));
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preload, { timeout: 4000 });
    } else {
        setTimeout(preload, 2000);
    }
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    // Each page is its own chunk, so the first load only downloads the page being opened
    resolve: (name) => pages[`./Pages/${name}.jsx`](),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);

        // Lets the mobile splash screen (rendered in app.blade.php) fade out once the first page has painted
        requestAnimationFrame(() => window.hideSplashScreen?.());

        warmUpPageChunks();
    },
    progress: {
        color: '#009bd2',
        delay: 100,
        includeCSS: true,
        showSpinner: false,
    },
});
