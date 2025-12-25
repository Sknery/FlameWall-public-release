import React, { useState, useEffect } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, CheckCircle, XCircle } from 'lucide-react';

function VerifyEmailChangePage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Confirming your new email address...');

    const token = searchParams.get('token');

    useEffect(() => {
        let hasConfirmed = false;

        if (!token) {
            setStatus('error');
            setMessage('Confirmation token not found. Please check the link in your email.');
            return;
        }

        const confirmChange = async () => {
            if (hasConfirmed) return;            hasConfirmed = true;
            try {
                const response = await axios.get(`/api/auth/confirm-email-change?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Your email address has been successfully updated!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Failed to confirm email change. The token might be invalid or expired.');
            }
        };

        confirmChange();
    }, [token]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    {status === 'verifying' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
                    {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
                    {status === 'error' && <XCircle className="mx-auto h-12 w-12 text-destructive" />}
                    <CardTitle className="mt-4 text-2xl">
                        {status === 'verifying' && 'Confirmation in Progress'}
                        {status === 'success' && 'Email Change Confirmed!'}
                        {status === 'error' && 'Confirmation Failed'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{message}</p>
                    {status === 'success' && (
                        <Button asChild className="w-full">
                            <RouterLink to="/profile/settings">Go to Settings</RouterLink>
                        </Button>
                    )}
                     {status === 'error' && (
                        <Button asChild variant="outline" className="w-full">
                            <RouterLink to="/">Back to Homepage</RouterLink>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default VerifyEmailChangePage;