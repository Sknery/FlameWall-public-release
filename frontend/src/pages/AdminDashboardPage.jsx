

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { Link as RouterLink } from 'react-router-dom';
import { format, subDays, startOfDay, isSameDay, subHours, startOfHour, isSameHour, subMonths, startOfMonth, isSameMonth, parseISO } from 'date-fns';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Terminal, Users, UserPlus, Activity, Wifi, ArrowRight, User, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import { constructImageUrl } from '../utils/url';
import VerifiedIcons from '../components/VerifiedIcons';


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#18181b',
      titleColor: '#e4e4e7',
      bodyColor: '#e4e4e7',
      borderColor: '#3f3f46',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: {
        color: '#27272a',
        drawBorder: false,
      },
      ticks: {
        color: '#a1a1aa',
        font: { size: 11 },
        maxTicksLimit: 8,
      },
    },
    y: {
      grid: {
        color: '#27272a',
        borderDash: [4, 4],
        drawBorder: false,
      },
      ticks: {
        color: '#a1a1aa',
        font: { size: 11 },
        maxTicksLimit: 5,
        precision: 0,
      },
      beginAtZero: true,
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    bar: {
      borderRadius: 4,
    }
  },
};

const StatCard = ({ title, value, icon, description }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
    </Card>
);

const UserListCard = ({ user }) => (
    <Card className="h-full flex flex-col hover:border-primary/50 transition-all duration-200 hover:shadow-md bg-card/50 group border-white/10">
        <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border ring-2 ring-background">
                    <AvatarImage src={constructImageUrl(user.pfp_url)} />
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="text-sm font-bold flex items-center gap-1 truncate">
                        {user.username}
                        <VerifiedIcons user={user} size="0.8em" />
                    </p>
                    <p className="text-xs font-medium opacity-80 truncate" style={{ color: user.rank?.display_color }}>
                        {user.rank?.name}
                    </p>
                </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                 <p className="text-[10px] text-muted-foreground font-mono">
                    Joined {format(new Date(user.first_login), 'MMM d')}
                </p>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                    <RouterLink to={`/users/${user.profile_slug || user.id}`}>
                        Profile <ArrowRight className="ml-1 h-3 w-3" />
                    </RouterLink>
                </Button>
            </div>
        </CardContent>
    </Card>
);

function AdminDashboardPage() {
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');

    const chartData = useMemo(() => {
        if (!stats || !stats.chartData) return { labels: [], registrations: [], online: [] };

        let labels = [];
        let registrationsData = [];
        const now = new Date();

        if (timeRange === '1d') {
            const last24Hours = Array.from({ length: 24 }, (_, i) => {
                const d = subHours(now, 23 - i);
                return startOfHour(d);
            });
            labels = last24Hours.map(hour => format(hour, 'HH:mm'));

            registrationsData = last24Hours.map(hour => {
                const match = stats.chartData.hourly.find(item => {
                    const itemDate = new Date(item.date);
                    return isSameHour(itemDate, hour);
                });
                return match ? parseInt(match.count, 10) : 0;
            });

        } else if (timeRange === '1y') {
            const last12Months = Array.from({ length: 12 }, (_, i) => {
                 const d = subMonths(now, 11 - i);
                 return startOfMonth(d);
             });

             labels = last12Months.map(month => format(month, 'MMM yyyy'));

             registrationsData = last12Months.map(month => {
                 const monthTotal = stats.chartData.daily
                     .filter(item => {
                         const itemDate = parseISO(item.date);
                         return isSameMonth(itemDate, month);
                     })
                     .reduce((acc, item) => acc + parseInt(item.count, 10), 0);
                 return monthTotal;
             });
        } else {
            const daysCount = timeRange === '30d' ? 30 : 7;
            const lastDays = Array.from({ length: daysCount }, (_, i) => {
                const d = subDays(now, daysCount - 1 - i);
                return startOfDay(d);
            });
            labels = lastDays.map(day => format(day, 'MMM d'));

            registrationsData = lastDays.map(day => {
                const match = stats.chartData.daily.find(item => {
                    const itemDate = parseISO(item.date);
                    return isSameDay(itemDate, day);
                });
                return match ? parseInt(match.count, 10) : 0;
            });
        }

        const onlineData = registrationsData.map(count => count > 0 ? Math.max(2, count * 2 + Math.floor(Math.random() * 5)) : 0);

        return { labels, registrations: registrationsData, online: onlineData };
    }, [stats, timeRange]);

    useEffect(() => {
        setBreadcrumbs([{ label: 'Admin Panel' }, { label: 'User Dashboard' }]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const fetchStats = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/user-stats', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setStats(response.data);
        } catch (err) {
            setError('Failed to load user statistics.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const lineChartData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'New Registrations',
                data: chartData.registrations,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#18181b',
                pointRadius: (timeRange === '30d' || timeRange === '1y') ? 2 : 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const barChartData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Peak Online (Est)',
                data: chartData.online,
                backgroundColor: '#3b82f6',
                hoverBackgroundColor: '#60a5fa',
                barThickness: (timeRange === '30d' || timeRange === '1y') ? 8 : 20,
            },
        ],
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!stats) return null;

    const getTitleSuffix = () => {
        if (timeRange === '1d') return '24h';
        if (timeRange === '7d') return '7 Days';
        if (timeRange === '30d') return '30 Days';
        if (timeRange === '1y') return '1 Year';
        return '';
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="font-sans text-3xl font-bold">User Dashboard</h1>

                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1d">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="1y">Last 1 Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="New Today"
                    value={stats.newToday}
                    icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
                    description="+24h growth"
                />
                <StatCard
                    title="New This Week"
                    value={stats.newThisWeek}
                    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                    description="Last 7 days"
                />
                <StatCard
                    title="Online Now"
                    value={stats.onlineNow}
                    icon={<Wifi className="h-4 w-4 text-green-500" />}
                    description="In-game players"
                />
            </div>

            {}
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Registration Trend ({getTitleSuffix()})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <Line options={chartOptions} data={lineChartData} />
                        </div>
                    </CardContent>
                </Card>

                {}
            </div>

            {}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-bold">Recently Registered</h2>
                    <p className="text-sm text-muted-foreground">Last 20 users</p>
                </div>

                <div className="relative group/scroll">
                    <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                    <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                        {stats.latestUsers.length > 0 ? (
                            stats.latestUsers.map(user => (
                                <div key={user.id} className="min-w-[280px] w-[280px] snap-start h-full">
                                    <UserListCard user={user} />
                                </div>
                            ))
                        ) : (
                            <div className="w-full py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                                No recent users found.
                            </div>
                        )}
                         <div className="min-w-[1px] h-1" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboardPage;