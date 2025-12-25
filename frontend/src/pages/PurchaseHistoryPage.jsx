
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Image as ImageIcon } from 'lucide-react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/joy';


import { constructImageUrl } from '../utils/url';

const PurchaseCard = ({ purchase }) => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Avatar className="rounded-md h-12 w-12">
                    <AvatarImage src={constructImageUrl(purchase.item?.image_url)} />
                    <AvatarFallback><ImageIcon /></AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{purchase.item?.name || 'Item no longer exists'}</p>
                    <p className="text-xs text-muted-foreground">
                        {new Date(purchase.purchased_at).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <p className="font-semibold">{purchase.purchase_price} coins</p>
        </CardContent>
    </Card>
);

function PurchaseHistoryPage() {
    const { authToken } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setBreadcrumbs } = useBreadcrumbs();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchHistory = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/purchases/my-history', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setHistory(response.data);
        } catch (err) {
            setError('Failed to load purchase history.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile', link: '/profile/me' },
            { label: 'Settings', link: '/profile/settings' },
            { label: 'Purchase History' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-4">
            <h1 className="font-sans text-3xl font-bold">My Purchase History</h1>

            {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">You haven't purchased any items yet.</p>
            ) : isMobile ? (
                <div className="space-y-3">
                    {history.map(purchase => <PurchaseCard key={purchase.purchase_id} purchase={purchase} />)}
                </div>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Item</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price Paid</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((purchase) => (
                                <TableRow key={purchase.purchase_id}>
                                    <TableCell>
                                        <Avatar className="rounded-md">
                                            <AvatarImage src={constructImageUrl(purchase.item?.image_url)} />
                                            <AvatarFallback><ImageIcon /></AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{purchase.item?.name || 'Item no longer exists'}</TableCell>
                                    <TableCell>{purchase.purchase_price} coins</TableCell>
                                    <TableCell>{new Date(purchase.purchased_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}

export default PurchaseHistoryPage;
