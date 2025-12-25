import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { constructImageUrl } from '../utils/url';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Search, Bell, LogOut, Settings, User, MessageSquare, HeartHandshake, Award, Shield, Globe, Database } from 'lucide-react';

const SidebarAction = ({ to, icon: Icon, label, onClick, children }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="relative">
                <Button asChild={!!to} variant="ghost" size="icon" onClick={onClick}>
                    {to ? <RouterLink to={to} onClick={onClick}><Icon className="h-5 w-5" /></RouterLink> : <Icon className="h-5 w-5" />}
                </Button>
                {children}
            </div>
        </TooltipTrigger>
        <TooltipContent side="left"><p>{label}</p></TooltipContent>
    </Tooltip>
);

const MobileSidebarLink = ({ to, icon: Icon, label, onClick, children }) => (
    <div className="relative">
        <Button asChild={!!to} variant="ghost" className="w-full justify-start" onClick={onClick}>
            {to ? <RouterLink to={to} onClick={onClick}><Icon className="mr-2 h-4 w-4" />{label}</RouterLink> : <><Icon className="mr-2 h-4 w-4" />{label}</>}
        </Button>
        {children}
    </div>
);


function RightSidebar({ togglePanel, isMobile, onClose }) {
    const navigate = useNavigate();
    const { isLoggedIn, user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const isWidgetLayout = useMediaQuery('(min-width: 1280px)');

    const handleAction = (action) => {
        if (action) action();
        if (isMobile && onClose) onClose();
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        if (isMobile && onClose) onClose();
    };

    const getActionProps = (panelType, path) => {
        if (isWidgetLayout) {
            return {
                onClick: () => togglePanel(panelType)
            };
        }
        else {
            return {
                to: path,
                onClick: () => {
                    if (onClose) onClose();
                }
            };
        }
    };

    if (isMobile) {
        return (
            <div className="flex flex-col h-full">
                {}
                <div className="p-4">
                    {isLoggedIn && user ? (
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={constructImageUrl(user.pfp_url)} />
                                <AvatarFallback>
                                    <User className="h-[60%] w-[60%]" />
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.username}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{user.rank?.name}</span>
                                    <div className="flex items-center gap-1">
                                        <Database className="h-3 w-3" />
                                        <span>{user.balance}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Button asChild className="w-full" onClick={onClose}>
                            <RouterLink to="/login">Login</RouterLink>
                        </Button>
                    )}
                </div>

                {}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {}
                    <MobileSidebarLink to="/search" icon={Search} label="Search" onClick={onClose} />

                    {isLoggedIn && user ? (
                        <>
                            <MobileSidebarLink to="/profile/me" icon={User} label="Profile" onClick={onClose} />
                            <MobileSidebarLink to="/messages" icon={MessageSquare} label="Messages" onClick={onClose} />
                            <MobileSidebarLink to="/friends" icon={HeartHandshake} label="Friends" onClick={onClose} />
                            <MobileSidebarLink to="/achievements" icon={Award} label="Achievements" onClick={onClose} />
                        </>
                    ) : null}

                    {}
                    <MobileSidebarLink onClick={() => handleAction(() => togglePanel('global'))} icon={Globe} label="Global Chat" />
                    {isLoggedIn && user?.clanMembership && <MobileSidebarLink onClick={() => handleAction(() => togglePanel('clan'))} icon={Shield} label="Clan Chat" />}

                    {isLoggedIn && user && (
                        <>
                            {}
                            <MobileSidebarLink onClick={() => handleAction(() => togglePanel('notifications'))} icon={Bell} label="Notifications">
                                {unreadCount > 0 && <Badge className="absolute top-1.5 right-3">{unreadCount}</Badge>}
                            </MobileSidebarLink>
                            {}
                            <MobileSidebarLink to="/profile/settings" icon={Settings} label="Settings" onClick={onClose} />
                        </>
                    )}
                </nav>

                {}
                {isLoggedIn && (
                    <div className="p-2 mt-auto ">
                        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex flex-col h-full items-center justify-center py-4 gap-2">
                {}
                <SidebarAction {...getActionProps('search', '/search')} icon={Search} label="Search" />

                {isLoggedIn && user ? (
                    <>
                        <div className="my-2" />
                        <SidebarAction {...getActionProps('profile', '/profile/me')} icon={User} label="Profile" />
                        <SidebarAction {...getActionProps('messages', '/messages')} icon={MessageSquare} label="Messages" />
                        <SidebarAction {...getActionProps('friends', '/friends')} icon={HeartHandshake} label="Friends" />
                        <SidebarAction {...getActionProps('achievements', '/achievements')} icon={Award} label="Achievements" />
                        <div className="my-2" />

                        {}
                        <SidebarAction onClick={() => togglePanel('global')} icon={Globe} label="Global Chat" />
                        {user.clanMembership && <SidebarAction onClick={() => togglePanel('clan')} icon={Shield} label="Clan Chat" />}

                        <div className="mt-auto flex flex-col items-center gap-2">
                            <SidebarAction onClick={() => togglePanel('notifications')} icon={Bell} label="Notifications">
                                {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 z-10">{unreadCount}</Badge>}
                            </SidebarAction>
                            <SidebarAction {...getActionProps('settings', '/profile/settings')} icon={Settings} label="Settings" />
                            <SidebarAction onClick={handleLogout} icon={LogOut} label="Logout" />
                        </div>
                    </>
                ) : (
                    <>
                        <SidebarAction onClick={() => togglePanel('global')} icon={Globe} label="Global Chat" />
                        <div className="mt-auto">
                            <SidebarAction to="/login" icon={LogOut} label="Login" />
                        </div>
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}

export default RightSidebar;

