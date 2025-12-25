import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, LogOut } from 'lucide-react';

function BannedUserOverlay() {
    const { user, logout } = useAuth();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <Ban className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4 text-2xl text-destructive">You Have Been Banned</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="font-semibold">Reason:</p>
                        <p className="text-muted-foreground">{user?.ban_reason || 'No reason provided.'}</p>
                    </div>
                    {user?.ban_expires_at && (
                        <p className="text-sm text-yellow-500">
                            Your ban expires on {format(new Date(user.ban_expires_at), 'MMMM d, yyyy HH:mm ')}
                            (in {formatDistanceToNow(new Date(user.ban_expires_at))}).
                        </p>
                    )}
                    <Button onClick={logout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default BannedUserOverlay;

