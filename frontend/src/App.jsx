

import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { BreadcrumbsProvider } from './context/BreadcrumbsContext';
import { Loader2 } from 'lucide-react';


import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';


const LandingPage = lazy(() => import('./pages/LandingPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const SingleNewsPage = lazy(() => import('./pages/SingleNewsPage'));
const PostsPage = lazy(() => import('./pages/PostsPage'));
const SinglePostPage = lazy(() => import('./pages/SinglePostPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const MyProfilePage = lazy(() => import('./pages/MyProfilePage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const EditPostPage = lazy(() => import('./pages/EditPostPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ConversationPage = lazy(() => import('./pages/ConversationPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LinkMinecraftPage = lazy(() => import('./pages/LinkMinecraftPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const ClansListPage = lazy(() => import('./pages/ClansListPage'));
const CreateClanPage = lazy(() => import('./pages/CreateClanPage'));
const ClanDetailPage = lazy(() => import('./pages/ClanDetailPage'));
const ManageClanPage = lazy(() => import('./pages/ManageClanPage'));
const CustomPageView = lazy(() => import('./pages/CustomPageView'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const PurchaseHistoryPage = lazy(() => import('./pages/PurchaseHistoryPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const VerifyEmailChangePage = lazy(() => import('./pages/VerifyEmailChangePage'));


const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminPostsDashboard = lazy(() => import('./pages/AdminPostsDashboard'));
const AdminShopDashboardPage = lazy(() => import('./pages/AdminShopDashboardPage'));
const CreateNewsPage = lazy(() => import('./pages/CreateNewsPage'));
const EditNewsPage = lazy(() => import('./pages/EditNewsPage'));
const AdminRanksPage = lazy(() => import('./pages/AdminRanksPage'));
const AdminShopPage = lazy(() => import('./pages/AdminShopPage'));
const AdminCustomPages = lazy(() => import('./pages/AdminCustomPages'));
const AdminEditPage = lazy(() => import('./pages/AdminEditPage'));
const AdminPageCategories = lazy(() => import('./pages/AdminPageCategories'));
const AdminAchievementsListPage = lazy(() => import('./pages/AdminAchievementsListPage'));
const AdminAchievementBuilderPage = lazy(() => import('./pages/AdminAchievementBuilderPage'));
const AdminBanReasonsPage = lazy(() => import('./pages/AdminBanReasonsPage'));
const AdminSiteSettingsPage = lazy(() => import('./pages/AdminSiteSettingsPage'));
const AdminTagsPage = lazy(() => import('./pages/AdminTagsPage'));


import UpdateNotification from './components/UpdateNotification';
import { API_BASE_URL } from './apiConfig';
import axios from 'axios';
import { hexToHslString, getContrastColor } from './utils/colors';

axios.defaults.baseURL = API_BASE_URL;

const LoadingFallback = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
);

const ThemedApp = () => {
  const { settings, loading } = useSettings();

   useEffect(() => {
        if (settings) {
            document.title = settings.site_name || 'FlameWall';

            const hslColorString = hexToHslString(settings.accent_color);
            if (hslColorString) {
                document.documentElement.style.setProperty('--primary', hslColorString);
                document.documentElement.style.setProperty('--ring', hslColorString);

                const contrastColor = getContrastColor(settings.accent_color);
                document.documentElement.style.setProperty('--primary-foreground', contrastColor);
            }
        }
    }, [settings]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Router>
      <UpdateNotification />
      {}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
            <Route path="/" element={<MainLayout />}>
            {}
            <Route index element={<LandingPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:newsId" element={<SingleNewsPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="posts/:postId" element={<SinglePostPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="users/:userId" element={<PublicProfilePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/p/:slug" element={<CustomPageView />} />
            <Route path="/clans" element={<ClansListPage />} />
            <Route path="/clans/:tag" element={<ClanDetailPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            {}
            <Route path="feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="messages/:userId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
            <Route path="posts/new" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="posts/:postId/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
            <Route path="/profile/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="profile/me" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
            <Route path="/profile/link-minecraft" element={<ProtectedRoute><LinkMinecraftPage /></ProtectedRoute>} />
            <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
            <Route path="/clans/new" element={<ProtectedRoute><CreateClanPage /></ProtectedRoute>} />
            <Route path="/clans/:tag/manage" element={<ProtectedRoute><ManageClanPage /></ProtectedRoute>} />
            <Route path="/profile/purchase-history" element={<ProtectedRoute><PurchaseHistoryPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {}
            <Route path="/admin/users" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/posts" element={<ProtectedRoute><AdminPostsDashboard /></ProtectedRoute>} />
            <Route path="/admin/shop-dashboard" element={<ProtectedRoute><AdminShopDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/news/create" element={<ProtectedRoute><CreateNewsPage /></ProtectedRoute>} />
            <Route path="/admin/news/:newsId/edit" element={<ProtectedRoute><EditNewsPage /></ProtectedRoute>} />
            <Route path="/admin/ranks" element={<ProtectedRoute><AdminRanksPage /></ProtectedRoute>} />
            <Route path="/admin/shop" element={<ProtectedRoute><AdminShopPage /></ProtectedRoute>} />
            <Route path="/admin/pages" element={<ProtectedRoute><AdminCustomPages /></ProtectedRoute>} />
            <Route path="/admin/pages/new" element={<ProtectedRoute><AdminEditPage /></ProtectedRoute>} />
            <Route path="/admin/pages/:pageId" element={<ProtectedRoute><AdminEditPage /></ProtectedRoute>} />
            <Route path="/admin/pages/categories" element={<ProtectedRoute><AdminPageCategories /></ProtectedRoute>} />
            <Route path="/admin/achievements" element={<ProtectedRoute><AdminAchievementsListPage /></ProtectedRoute>} />
            <Route path="/admin/achievements/new" element={<ProtectedRoute><AdminAchievementBuilderPage /></ProtectedRoute>} />
            <Route path="/admin/achievements/edit/:id" element={<ProtectedRoute><AdminAchievementBuilderPage /></ProtectedRoute>} />
            <Route path="/admin/ban-reasons" element={<ProtectedRoute><AdminBanReasonsPage /></ProtectedRoute>} />
            <Route path="/admin/site-settings" element={<ProtectedRoute><AdminSiteSettingsPage /></ProtectedRoute>} />
            <Route path="/admin/tags" element={<ProtectedRoute><AdminTagsPage /></ProtectedRoute>} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-email-change" element={<VerifyEmailChangePage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <SettingsProvider>
        <AuthProvider>
            <NotificationsProvider>
              <BreadcrumbsProvider>
                <ThemedApp />
              </BreadcrumbsProvider>
            </NotificationsProvider>
        </AuthProvider>
    </SettingsProvider>
  );
}

export default App;