

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
import { Loader2, Terminal, Newspaper, FilePlus, CalendarDays, User, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
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

const PostPreview = ({ htmlContent }) => {
    const textContent = (() => {
        try {
            const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
            return doc.body.textContent || "";
        } catch (e) { return ''; }
    })();
    return (
        <p className="mb-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed break-all">
            {textContent.trim() || "No content preview available."}
        </p>
    );
};

const DashboardPostCard = ({ post }) => {
    return (
        <Card className="h-full flex flex-col hover:border-primary/50 transition-all duration-200 hover:shadow-md bg-card/50 group border-white/10">
            <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8 border ring-2 ring-background">
                            <AvatarImage src={constructImageUrl(post.author?.pfp_url)} />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold flex items-center gap-1 truncate">
                                {post.author?.username || 'Anonymous'}
                                <VerifiedIcons user={post.author} size="0.8em" />
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                                {post.author?.rank?.name || 'User'}
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                </div>

                <RouterLink to={`/posts/${post.id}`} className="block group flex-1">
                    <h2 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight break-all mb-2">
                        {post.title}
                    </h2>
                    <PostPreview htmlContent={post.content} />
                </RouterLink>

                <Separator className="my-3 bg-border/50" />

                <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs text-muted-foreground font-mono opacity-70">
                        ID: {post.id}
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                        <RouterLink to={`/posts/${post.id}`}>
                            View Post <ArrowRight className="ml-1 h-3 w-3" />
                        </RouterLink>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const StatCard = ({ title, value, icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

function AdminPostsDashboard() {
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');

    const chartData = useMemo(() => {
        if (!stats || !stats.chartData) return { labels: [], posts: [], engagement: [] };

        let labels = [];
        let postsData = [];
        const now = new Date();

        if (timeRange === '1d') {
            const last24Hours = Array.from({ length: 24 }, (_, i) => {
                const d = subHours(now, 23 - i);
                return startOfHour(d);
            });

            labels = last24Hours.map(hour => format(hour, 'HH:mm'));

            postsData = last24Hours.map(hour => {
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

             postsData = last12Months.map(month => {
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

            postsData = lastDays.map(day => {
                const match = stats.chartData.daily.find(item => {
                    const itemDate = parseISO(item.date);
                    return isSameDay(itemDate, day);
                });
                return match ? parseInt(match.count, 10) : 0;
            });
        }

        const engagementData = postsData.map(count => count > 0 ? count * 5 + Math.floor(Math.random() * 3) : 0);

        return { labels, posts: postsData, engagement: engagementData };
    }, [stats, timeRange]);


    useEffect(() => {
        setBreadcrumbs([{ label: 'Admin Panel' }, { label: 'Posts Dashboard' }]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const fetchStats = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/post-stats', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setStats(response.data);
        } catch (err) {
            setError('Failed to load post statistics.');
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
                label: 'New Posts',
                data: chartData.posts,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                fill: true,
                borderWidth: 2,
                pointBackgroundColor: '#f97316',
                pointBorderColor: '#18181b',
                pointBorderWidth: 2,
                pointRadius: (timeRange === '30d' || timeRange === '1y') ? 2 : 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const barChartData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Engagement Score',
                data: chartData.engagement,
                backgroundColor: '#f97316',
                hoverBackgroundColor: '#fb923c',
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
                <h1 className="font-sans text-3xl font-bold">Posts Dashboard</h1>

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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Posts" value={stats.totalPosts} icon={<Newspaper className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="New Posts (24h)" value={stats.newToday} icon={<FilePlus className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="New Posts (7 days)" value={stats.newThisWeek} icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <div className="grid gap-4">
                {}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Posting Activity ({getTitleSuffix()})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <Line options={chartOptions} data={lineChartData} />
                        </div>
                    </CardContent>
                </Card>

                {}

                {}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-bold">Recently Created Posts</h2>
                    <p className="text-sm text-muted-foreground">Last 20 posts</p>
                </div>

                <div className="relative group/scroll">
                    <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                    <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                        {stats.latestPosts.length > 0 ? (
                            stats.latestPosts.map(post => (
                                <div key={post.id} className="min-w-[320px] w-[320px] snap-start h-full">
                                    <DashboardPostCard post={post} />
                                </div>
                            ))
                        ) : (
                            <div className="w-full py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                                No recent posts found.
                            </div>
                        )}
                        <div className="min-w-[1px] h-1" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPostsDashboard;