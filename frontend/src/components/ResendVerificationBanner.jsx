import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, MailWarning } from 'lucide-react';

function ResendVerificationBanner() {
    const { user, authToken, isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        setLoading(true);
        try {
            await axios.post('/api/auth/resend-verification', {}, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('A new verification email has been sent to your address.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send email.');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoggedIn || user.email_verified_at) {
        return null;
    }

    return (
        <div className="px-4 md:px-6 py-2">
            <Alert variant="default" className="bg-yellow-900/20 border-yellow-500/50 text-yellow-200 [&>svg]:text-yellow-400">
                <MailWarning className="h-4 w-4" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                    <div>
                        <AlertTitle className="text-yellow-300">Confirm Your Email</AlertTitle>
                        <AlertDescription>
                            Please check your inbox to verify your email address.
                        </AlertDescription>
                    </div>
                    <Button
                        onClick={handleResend}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="mt-2 sm:mt-0 bg-transparent hover:bg-yellow-400/20 border-yellow-400/50 text-yellow-300 hover:text-yellow-200"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Resend Email
                    </Button>
                </div>
            </Alert>
        </div>
    );
}

export default ResendVerificationBanner;
