
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const { authToken } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function getSubscription() {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                const sub = await registration.pushManager.getSubscription();
                setIsSubscribed(!!sub);
                setSubscription(sub);
            }
        }
        getSubscription();
    }, []);

    const subscribe = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setError('Push notifications are not supported by this browser.');
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        if (!registration) {
             setError('Service worker not registered.');
             return;
        }

        try {
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            await axios.post('/api/notifications/subscribe', sub, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            setSubscription(sub);
            setIsSubscribed(true);
        } catch (err) {
            setError('Failed to subscribe to push notifications.');
            console.error('Subscription error:', err);
        }
    };


    return { subscribe, isSubscribed, error };
}