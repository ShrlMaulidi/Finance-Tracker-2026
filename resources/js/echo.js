import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

window.Pusher = Pusher;

// Determine host dynamically: on mobile or local IP, use current hostname so mobile doesn't connect to phone's localhost
const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

const echoKey = import.meta.env.VITE_REVERB_APP_KEY;
const echoPort = isHttps ? 443 : (import.meta.env.VITE_REVERB_PORT ? Number(import.meta.env.VITE_REVERB_PORT) : 8080);
const echoScheme = isHttps ? 'https' : (import.meta.env.VITE_REVERB_SCHEME || 'http');

let echoInstance = null;

if (echoKey && typeof window !== 'undefined') {
    try {
        echoInstance = new Echo({
            broadcaster: 'reverb',
            key: echoKey,
            wsHost: currentHost,
            wsPort: echoPort,
            wssPort: echoPort,
            forceTLS: echoScheme === 'https',
            enabledTransports: ['ws', 'wss'],
            authorizer: (channel, options) => {
                return {
                    authorize: (socketId, callback) => {
                        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                        axios.post('/broadcasting/auth', {
                            socket_id: socketId,
                            channel_name: channel.name,
                        }, {
                            headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
                            withCredentials: true,
                        })
                        .then((response) => {
                            callback(false, response.data);
                        })
                        .catch((error) => {
                            console.error('[Echo] Private channel authorization failed:', error);
                            callback(error || true);
                        });
                    },
                };
            },
        });

        // Track connection status for debugging and UI feedback
        if (echoInstance.connector?.pusher?.connection) {
            echoInstance.connector.pusher.connection.bind('state_change', (states) => {
                console.log(`[Reverb WebSocket] State changed: ${states.previous} -> ${states.current} on host ${currentHost}:${echoPort}`);
                window.dispatchEvent(new CustomEvent('reverb-status-change', { detail: { state: states.current, previous: states.previous } }));
            });
        }

        window.Echo = echoInstance;
    } catch (e) {
        console.warn('[Echo] WebSocket initialization error:', e);
    }
}

export default echoInstance;
