/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register';

export function reloadSW() {
    registerSW({
        onNeedRefresh() {
            console.log('New content available, verify to reload.');
        },
        onOfflineReady() {
            console.log('App is ready for offline usage.');
        },
    });
}
