

import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';


import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsRight, X, MailCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';


const NotificationItem = ({ notification, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full text-left p-3 rounded-lg transition-colors hover:bg-accent",
            !notification.read && "bg-primary/10"
        )}
    >
        <p className="font-semibold text-sm">{notification.title}</p>
        <p className="text-xs text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
    </button>
);

function NotificationsWidget({ onToggle, isMobile }) {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.notification_id);
        }
        if (notification.link) {
            navigate(notification.link);
            onToggle();
        }
    };

    const handleMarkAllRead = () => {
        markAllAsRead();
        toast.success("All notifications marked as read.");
    };

    return (
        <Card className="h-full w-full flex flex-col shadow-2xl bg-[#09090b] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-white/10">
                 <h3 className="font-semibold">Notifications</h3>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                    {isMobile ? <X className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-3">
                    <div className="flex flex-col gap-2">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <NotificationItem key={n.notification_id} notification={n} onClick={() => handleNotificationClick(n)} />
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full py-20">
                                <p className="text-muted-foreground text-sm">You have no notifications.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 border-t flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                    <MailCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
                <Button asChild className="w-full">
                    <RouterLink to="/notifications">
                        <Eye className="mr-2 h-4 w-4" />
                        View all
                    </RouterLink>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default NotificationsWidget;
