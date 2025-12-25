

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { useAuth } from '@/context/AuthContext';
import { Home, ChevronRight, Database } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { constructImageUrl } from '../utils/url';

export const BreadcrumbTrail = () => {
    const { breadcrumbs } = useBreadcrumbs();
    const { user, isLoggedIn } = useAuth();

    return (
        <div className="flex items-center justify-between w-full">
            <nav className="hidden md:flex items-center text-sm">
                <RouterLink to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    <Home className="h-4 w-4" />
                </RouterLink>
                {breadcrumbs && breadcrumbs.length > 0 && breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                        {crumb.link ? (
                             <RouterLink to={crumb.link} className="text-muted-foreground hover:text-primary transition-colors">
                                {crumb.label}
                            </RouterLink>
                        ) : (
                            <span className="font-semibold text-foreground">{crumb.label}</span>
                        )}
                    </React.Fragment>
                ))}
            </nav>

            {}
            {isLoggedIn && user && (
                <div className="flex items-center gap-4 ml-auto">

                                        {}
                    <div className="flex items-center gap-2 rounded-full text-sm font-medium hover:bg-muted/60 transition-colors cursor-default">
                        <Database className="h-3.5 w-3.5 text-primary" />
                        <span>{user.balance}</span>
                    </div>
                    {}
                    <RouterLink to="/profile/me" className="flex items-center gap-3 group pl-2">
                        <div className="text-right hidden sm:block leading-tight">
                            <p className="text-sm font-bold group-hover:text-primary transition-colors">
                                {user.username}
                            </p>

                        </div>
                        <Avatar className="h-8 w-8 border border-white/10 group-hover:border-primary/50 transition-all">
                            <AvatarImage src={constructImageUrl(user.pfp_url)} />
                            <AvatarFallback className="text-xs">{user.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </RouterLink>

                </div>
            )}
        </div>
    );
};