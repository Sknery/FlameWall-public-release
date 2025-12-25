import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { Link as RouterLink } from 'react-router-dom';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Terminal, Users, ShoppingCart, DollarSign, User } from 'lucide-react';


import { constructImageUrl } from '../utils/url';
import { format } from 'date-fns';

const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));


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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-background border rounded-md shadow-lg">
                <p className="font-bold">{label}</p>
                <p className="text-sm text-primary">{`Sales: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const SalesChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);

function AdminShopDashboardPage() {
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setBreadcrumbs([{ label: 'Admin Panel' }, { label: 'Shop Dashboard' }]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const fetchStats = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/shop-stats', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setStats(response.data);
        } catch (err) {
            setError('Failed to load shop statistics.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!stats) return null;

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold">Shop Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Revenue" value={`${stats.totalRevenue} coins`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Total Sales" value={stats.totalSales} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Unique Customers" value={stats.uniqueCustomers} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Sales by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {}
                        <Suspense fallback={<div className="h-[300px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                            <SalesChart data={stats.salesByCategory} />
                        </Suspense>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>Top Selling Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topSellingItems.map(item => (
                                <div key={item.itemId} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <span className="font-bold">{item.salesCount}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Purchases</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.recentPurchases.map(purchase => (
                                <TableRow key={purchase.purchase_id}>
                                    <TableCell className="font-medium">{purchase.item.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={constructImageUrl(purchase.user.pfp_url)} />
                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                            <span>{purchase.user.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{purchase.purchase_price} coins</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {format(new Date(purchase.purchased_at), 'MMM d, yyyy HH:mm')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default AdminShopDashboardPage;
