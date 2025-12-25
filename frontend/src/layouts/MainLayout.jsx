

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Outlet, Link as RouterLink, useOutletContext, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';


import BannedUserOverlay from '@/components/BannedUserOverlay';
import CollapsiblePushSidebar from '@/components/CollapsiblePushSidebar';
import RightSidebar from '@/components/RightSidebar';
import { BreadcrumbTrail } from '../components/BreadcrumbTrail';
import ResendVerificationBanner from '../components/ResendVerificationBanner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, Loader2, X, ChevronsRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSettings } from '../context/SettingsContext';
import { constructImageUrl } from '../utils/url';


const GlobalChatWidget = React.lazy(() => import('../components/GlobalChatWidget'));
const ClanChatWidget = React.lazy(() => import('../components/ClanChatWidget'));
const NotificationsWidget = React.lazy(() => import('../components/NotificationsWidget'));
const UserProfileSidebar = React.lazy(() => import('../components/UserProfileSidebar'));
const FriendsWidget = React.lazy(() => import('../components/FriendsWidget'));
const AchievementsWidget = React.lazy(() => import('../components/AchievementsWidget'));
const SearchWidget = React.lazy(() => import('../components/SearchWidget'));
const SettingsWidget = React.lazy(() => import('../components/SettingsWidget'));
const MessagesWidget = React.lazy(() => import('../components/MessagesWidget'));

const WidgetWrapper = ({ title, children, onToggle, isMobile }) => (
    <Card className="h-full w-full flex flex-col shadow-2xl border-white/10">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-white/10">
            <h3 className="font-semibold">{title}</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                {isMobile ? <X className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-3">
                {children}
            </ScrollArea>
        </CardContent>
    </Card>
);

const WidgetLoader = () => (
    <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
    </div>
);

const PageLoader = () => (
    <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
    </div>
);

function MainLayout() {
  const { user, isLoggedIn } = useAuth();
  const { settings } = useSettings();

  const { isFlashing } = useNotifications();

  const [panelState, setPanelState] = useState({ type: null, isOpen: false });
  const location = useLocation();

  const [layoutOptions, setLayoutOptions] = useState({
      hasBottomPadding: true,
      noPadding: false
  });

  const [stickyHeader, setStickyHeader] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
      setStickyHeader(null);
  }, [location.pathname]);

  const [isLeftSheetOpen, setIsLeftSheetOpen] = useState(false);
  const [isRightSheetOpen, setIsRightSheetOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1400px)');
  const closeLeftSheet = () => setIsLeftSheetOpen(false);
  const closeRightSheet = () => setIsRightSheetOpen(false);

  const togglePanel = (panelType) => {
    if (isRightSheetOpen) setIsRightSheetOpen(false);
    setPanelState(prevState => {
      if (prevState.type === panelType && prevState.isOpen) {
        return { type: null, isOpen: false };
      }
      return { type: panelType, isOpen: true };
    });
  };

  if (isLoggedIn && user?.is_banned) {
    return <BannedUserOverlay />;
  }

  const isPanelOpen = panelState.isOpen;

  const renderPanelContent = (isMobile) => {
      switch (panelState.type) {
          case 'global': return <GlobalChatWidget onToggle={() => togglePanel('global')} isMobile={isMobile} />;
          case 'clan': return <ClanChatWidget onToggle={() => togglePanel('clan')} isMobile={isMobile} />;
          case 'notifications': return <NotificationsWidget onToggle={() => togglePanel('notifications')} isMobile={isMobile} />;
          case 'profile': return <div className="h-full w-full relative"><UserProfileSidebar user={user} /><Button variant="ghost" size="icon" className="h-7 w-7 absolute top-3 right-3 z-10" onClick={() => togglePanel('profile')}>{isMobile ? <X className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}</Button></div>;
          case 'friends': return <WidgetWrapper title="Friends" onToggle={() => togglePanel('friends')} isMobile={isMobile}><FriendsWidget /></WidgetWrapper>;
          case 'achievements': return <WidgetWrapper title="Achievements" onToggle={() => togglePanel('achievements')} isMobile={isMobile}><AchievementsWidget /></WidgetWrapper>;
          case 'search': return <WidgetWrapper title="Search" onToggle={() => togglePanel('search')} isMobile={isMobile}><SearchWidget /></WidgetWrapper>;
          case 'settings': return <SettingsWidget onToggle={() => togglePanel('settings')} isMobile={isMobile} />;
          case 'messages': return <WidgetWrapper title="Messages" onToggle={() => togglePanel('messages')} isMobile={isMobile}><MessagesWidget/></WidgetWrapper>;
          default: return null;
      }
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">

      <div
        className={cn(
            "fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-500 ease-out border-[6px] sm:border-[8px] border-primary/70 shadow-[inset_0_0_30px_rgba(var(--primary),0.5)]",
            isFlashing ? "opacity-100" : "opacity-0"
        )}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{ duration: 5000 }}
        containerStyle={{
          right: isDesktop ? '88px' : '16px',
          bottom: '16px',
          transition: 'right 0.3s ease-in-out'
        }}
      />

      <div className="hidden lg:block bg-none w-[280px] shrink-0">
        <CollapsiblePushSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <header className="flex lg:hidden h-14 items-center gap-4 px-4 shrink-0 bg-black">
          <Sheet open={isLeftSheetOpen} onOpenChange={setIsLeftSheetOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]"><CollapsiblePushSidebar onClose={closeLeftSheet} /></SheetContent>
          </Sheet>
          <div className="flex-1 text-center">
            <RouterLink to="/" className="flex items-center justify-center gap-2 font-semibold">
              <img src={constructImageUrl(settings?.logo_url) || '/logo.png'} alt="Logo" className="h-8 w-8" />
              <span className="text-xl mt-1">{settings?.site_name || 'FlameWall'}</span>
            </RouterLink>
          </div>
          <Sheet open={isRightSheetOpen} onOpenChange={setIsRightSheetOpen}>
            <SheetTrigger asChild>
              <div className="md:hidden">
               <Button variant="ghost" size="icon" className="shrink-0">
                  <User className="h-5 w-5" />
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col p-0 w-[280px]"><RightSidebar isMobile={true} togglePanel={togglePanel} onClose={closeRightSheet} /></SheetContent>
          </Sheet>
        </header>

        <header className="hidden lg:flex items-center h-14 px-6 shrink-0 bg-black">
          <BreadcrumbTrail />
        </header>

        <ResendVerificationBanner />

        <motion.div
          className="flex-1 grid overflow-hidden h-full"
          animate={{
            gridTemplateColumns: isPanelOpen ? '1fr 400px' : '1fr 0px'
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <main className="overflow-hidden flex flex-col relative h-full w-full bg-black">
            <AnimatePresence>
                {stickyHeader && (
                    <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute top-0 left-0 right-0 z-50 w-full bg-background/80 backdrop-blur-md border-b shadow-sm"
                    >
                        {stickyHeader}
                    </motion.div>
                )}
            </AnimatePresence>

            <div
              ref={scrollRef}
              className={cn(
                "w-full h-full flex flex-col",
                !layoutOptions.noPadding && "overflow-y-scroll p-4 md:p-9 scrollbar-left",
                layoutOptions.hasBottomPadding && !layoutOptions.noPadding && "pb-8"
            )}>
              {}
              {}
              <Suspense fallback={<PageLoader />}>
                  <Outlet context={{ togglePanel, setLayoutOptions, scrollRef, setStickyHeader }} />
              </Suspense>
            </div>
          </main>

          <aside className="hidden widget:block h-full shrink-0 overflow-hidden py-6 pr-6 bg-black">
            <AnimatePresence>
              {isPanelOpen && (
                <motion.div
                  key={panelState.type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="h-full w-full"
                >
                  <Suspense fallback={<WidgetLoader />}>
                      {renderPanelContent(false)}
                    </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </motion.div>
      </div>

      <div className="hidden md:block bg-none w-[72px] shrink-0">
        <RightSidebar togglePanel={togglePanel} isMobile={false} />
      </div>

      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="widget:hidden fixed inset-0 z-[100]"
          >
            <Suspense fallback={<WidgetLoader />}>
                {renderPanelContent(true)}
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function useLayout() {
  return useOutletContext();
}

export default MainLayout;