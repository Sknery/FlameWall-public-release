

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Alert, Typography, Link as JoyLink, Stack } from '@mui/joy';
import InfoIcon from '@mui/icons-material/Info';
import { useSound } from '../hooks/use-sound';

const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

const NotificationToast = ({ notification, toastInstance }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        if (notification.link) navigate(notification.link);
        toast.dismiss(toastInstance.id);
    };
    return (
        <JoyLink onClick={handleClick} overlay sx={{ textDecoration: 'none', cursor: 'pointer' }}>
            <Alert key={notification.notification_id} variant="soft" color="primary" startDecorator={<InfoIcon />} sx={{ boxShadow: 'lg', width: '350px' }}>
                <Stack>
                    <Typography fontWeight="lg">{notification.title}</Typography>
                    <Typography level="body-sm">{notification.message}</Typography>
                </Stack>
            </Alert>
        </JoyLink>
    );
};

export const NotificationsProvider = ({ children }) => {
    const { isLoggedIn, authToken, socket } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [friendshipUpdateTrigger, setFriendshipUpdateTrigger] = useState(null);
    const [playNotificationSound] = useSound('/sounds/notification.mp3');

    const [isFlashing, setIsFlashing] = useState(false);

    const triggerAmbientNotification = useCallback(() => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 600);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }

        playNotificationSound();
    }, [playNotificationSound]);

    const fetchNotifications = useCallback(async () => {
        if (!authToken) return;
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const response = await axios.get(`/api/notifications`, config);
            const notificationsArray = Array.isArray(response.data) ? response.data : response.data.data;
            if (!Array.isArray(notificationsArray)) return;
            setNotifications(notificationsArray);
            setUnreadCount(notificationsArray.filter(n => !n.read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error.response?.data || error.message);
        }
    }, [authToken]);

    useEffect(() => {
        if (isLoggedIn) fetchNotifications();
        else {
          setNotifications([]);
          setUnreadCount(0);
        }
    }, [isLoggedIn, fetchNotifications]);

    useEffect(() => {
        if (socket) {
          const handleNewNotification = (newNotification) => {
            setNotifications(prev => prev.find(n => n.notification_id === newNotification.notification_id) ? prev : [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            if (['message.sent', 'clan.message'].includes(newNotification.type)) {
                 triggerAmbientNotification();
            } else {
                triggerAmbientNotification();
                toast.custom((t) => <NotificationToast notification={newNotification} toastInstance={t} />);
            }

            if (newNotification?.type?.startsWith('friendship.')) {
              setFriendshipUpdateTrigger(Date.now());
            }
          };
          socket.on('newNotification', handleNewNotification);
          return () => { socket.off('newNotification', handleNewNotification); };
        }
    }, [socket, triggerAmbientNotification]);

    const markAsRead = useCallback(async (notificationId) => {
        setNotifications(prevNotifications => {
            const notification = prevNotifications.find(n => n.notification_id === notificationId);
            if (!notification || notification.read) return prevNotifications;
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
            return prevNotifications.map(n => n.notification_id === notificationId ? { ...n, read: true } : n);
        });

        try {
          await axios.post(`/api/notifications/${notificationId}/read`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
        } catch (error) {
          console.error("Failed to mark notification as read", error);
        }
    }, [authToken]);

    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        try {
          await axios.post(`/api/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
        } catch (error) {
          console.error("Failed to mark all notifications as read", error);
          fetchNotifications();
        }
    }, [authToken, fetchNotifications]);

    const markNotificationsAsReadByLink = useCallback(async (link) => {
        try {
            const { data } = await axios.post(`/api/notifications/read-by-link`, { link }, { headers: { Authorization: `Bearer ${authToken}` } });
            if (data.affected > 0) {
                fetchNotifications();
            }
        } catch (error) {
            console.error("Failed to mark by link", error);
        }
    }, [authToken, fetchNotifications]);

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        markAsRead,
        friendshipUpdateTrigger,
        markAllAsRead,
        markNotificationsAsReadByLink,
        isFlashing,    }), [notifications, unreadCount, markAsRead, friendshipUpdateTrigger, markAllAsRead, markNotificationsAsReadByLink, isFlashing]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};