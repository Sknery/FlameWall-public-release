

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationsContext';
import { isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MailCheck, BellRing, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const groupNotificationsByDate = (notifications) => {
    const groups = {
        Today: [],
        Yesterday: [],
        Older: []
    };

    notifications.forEach(n => {
        const date = new Date(n.created_at);
        if (isToday(date)) {
            groups.Today.push(n);
        } else if (isYesterday(date)) {
            groups.Yesterday.push(n);
        } else {
            groups.Older.push(n);
        }
    });

    return groups;
};

const NotificationItem = ({ notification, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full text-left py-4 px-2 sm:px-4 transition-colors hover:bg-muted/50 flex items-start gap-4 group",
            !notification.read && "bg-primary/5 hover:bg-primary/10"
        )}
    >
        <div className="mt-1 shrink-0">
            {notification.read ? (
                <Bell className="h-5 w-5 text-muted-foreground/50" />
            ) : (
                <BellRing className="h-5 w-5 text-primary fill-primary/20" />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
                <p className={cn("font-medium text-sm break-words", !notification.read && "font-semibold text-foreground")}>
                    {notification.title}
                </p>
                <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                     {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 break-words leading-relaxed">
                {notification.message}
            </p>
        </div>
    </button>
);

function NotificationsPage() {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile', link: '/profile/me' },
            { label: 'Notifications' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.notification_id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const groupedNotifications = groupNotificationsByDate(notifications);
    const hasNotifications = notifications.length > 0;

    return (
        <div className=" mx-auto w-full">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2 sm:px-0">
                <h1 className="font-sans text-3xl font-bold">Your Notifications</h1>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                >
                    <MailCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </div>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {hasNotifications ? (
                    <div className="divide-y">
                        {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) =>
                            groupNotifications.length > 0 && (
                                <div key={groupName}>
                                    <div className="bg-muted/30 px-4 py-2 border-b last:border-0">
                                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {groupName}
                                        </h2>
                                    </div>
                                    <div className="divide-y">
                                        {groupNotifications.map(n => (
                                            <NotificationItem
                                                key={n.notification_id}
                                                notification={n}
                                                onClick={() => handleNotificationClick(n)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="bg-muted/50 p-4 rounded-full mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-medium">You're all caught up</p>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                            No new notifications at the moment. Check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificationsPage;