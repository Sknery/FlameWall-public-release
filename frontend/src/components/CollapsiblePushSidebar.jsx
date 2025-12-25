

import React, { useState, useEffect } from 'react';
import { NavLink, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { constructImageUrl } from '../utils/url';

import * as Icons from 'lucide-react';

const Icon = ({ name, ...props }) => {
    const LucideIcon = Icons[name];
    if (!LucideIcon) return <Icons.ChevronRight {...props} />;
    return <LucideIcon {...props} />;
};

const SidebarLink = ({ to, icon, children, onClick, isExternal }) => {
    if (isExternal) {
        return (
            <a
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary text-base text-neutral-300"
            >
                <Icon name={icon} className="h-5 w-5" />
                {children}
                <Icons.ExternalLink className="h-4 w-4 ml-auto opacity-50" />
            </a>
        );
    }

    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary text-base ${isActive ? "bg-muted text-primary font-semibold" : "text-neutral-300"}`}
        >
            <Icon name={icon} className="h-5 w-5" />
            {children}
        </NavLink>
    );
};

const SidebarAccordionItem = ({ item, onClick, user }) => (
    <AccordionItem value={item.name} className="border-b-0">
        <AccordionTrigger className="hover:no-underline text-neutral-300 hover:text-primary py-2 px-3 text-base">
            <div className="flex items-center gap-3"><Icon name={item.icon} className="h-5 w-5" />{item.name}</div>
        </AccordionTrigger>
        <AccordionContent className="pl-8 pb-1 space-y-1">
            {item.subItems.map(subItem => {
                if (subItem.name === 'My Clan') {
                    if (!user?.clanMembership) {
                        return null;
                    }
                    const clanPath = `/clans/${user.clanMembership.clan.tag}`;
                    return <SidebarLink to={clanPath} icon={subItem.icon} key={subItem.name} onClick={onClick}>{subItem.name}</SidebarLink>
                }

                return <SidebarLink to={subItem.path} icon={subItem.icon} key={subItem.name} onClick={onClick}>{subItem.name}</SidebarLink>
            })}
        </AccordionContent>
    </AccordionItem>
);


function CollapsiblePushSidebar({ onClose }) {
    const { isLoggedIn, user } = useAuth();
    const { settings } = useSettings();
    const [navItems, setNavItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = user?.rank?.power_level >= 800;

    useEffect(() => {
        const fetchNavItems = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/navigation/sidebar');
                setNavItems(response.data);
            } catch (error) {
                console.error("Failed to load navigation items:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNavItems();
    }, []);

    const filteredNavItems = navItems.filter(item => {
        if (item.adminRequired && !isAdmin) return false;
        if (item.authRequired && !isLoggedIn) return false;
        return true;
    });


    const adminPanel = filteredNavItems.find(item => item.name === 'Admin Panel');
    if (adminPanel) {

        if (!adminPanel.subItems.find(sub => sub.name === 'Tags')) {
            adminPanel.subItems.push({ name: 'Tags', icon: 'Tags', path: '/admin/tags' });
             adminPanel.subItems.sort((a, b) => a.name.localeCompare(b.name));
        }
    }


    const defaultOpenItems = filteredNavItems.filter(item => item.subItems).map(item => item.name);

    return (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
                <RouterLink to="/" className="flex items-center gap-2 font-semibold">
                    <img src={constructImageUrl(settings?.logo_url) || '/logo.png'} alt="FlameWall Logo" className="h-8 w-8" />
                    <span className="mt-1 text-xl">{settings?.site_name || 'FlameWall'}</span>
                </RouterLink>
            </div>
            <div className="flex-1 overflow-y-auto py-2 rtl">
                <nav className="grid items-start px-2 text-base font-medium lg:px-4 ltr">
                    {loading ? (
                        <div className="flex justify-center items-center h-full p-10">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <Accordion type="multiple" defaultValue={defaultOpenItems} className="w-full">
                            {filteredNavItems.map(item => {
                                const itemWithContext = item.name === "My Profile" ? { ...item, user } : item;

                                if (item.subItems) {
                                    return <SidebarAccordionItem key={item.name} item={item} onClick={onClose} user={user} />
                                }


                                if (item.isExternalShop) {
                                    const externalShopUrl = import.meta.env.VITE_EXTERNAL_SHOP_URL;
                                    if (externalShopUrl) {
                                        return <SidebarLink to={externalShopUrl} icon={item.icon} key={item.name} onClick={onClose} isExternal={true}>{item.name}</SidebarLink>
                                    }
                                }

                                return <SidebarLink to={item.path} icon={item.icon} key={item.name} onClick={onClose}>{item.name}</SidebarLink>
                            })}
                        </Accordion>
                    )}
                </nav>
            </div>
        </div>
    );
};

export default CollapsiblePushSidebar;
