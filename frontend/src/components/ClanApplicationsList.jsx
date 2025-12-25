import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Check, X, Loader2, User } from 'lucide-react';
import { constructImageUrl } from '../utils/url';
import toast from 'react-hot-toast';

function ClanApplicationsList({ applications, onUpdate }) {
    const { authToken } = useAuth();
    const [loadingAction, setLoadingAction] = useState(null);

    const handleProcessApplication = async (applicationId, status) => {
        setLoadingAction(applicationId);
        try {
            await axios.patch(
                `/api/clans/applications/${applicationId}/handle`,
                { status },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            toast.success(`Application has been ${status}.`);
            onUpdate();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed.');
        } finally {
            setLoadingAction(null);
        }
    };

    if (!applications || applications.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    There are no pending applications.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Applications ({applications.length})</CardTitle>
                <CardDescription>Review and process applications from players who want to join.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {applications.map((app) => (
                    <Card key={app.id} className="bg-muted/50">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={constructImageUrl(app.user.pfp_url)} />
                                        <AvatarFallback>
                                            <User className="h-[60%] w-[60%]" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{app.user.username}</p>
                                        <p className="text-xs text-muted-foreground">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        size="sm"
                                        onClick={() => handleProcessApplication(app.id, 'accepted')}
                                        disabled={loadingAction === app.id}
                                        className="flex-1"
                                    >
                                        {loadingAction === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleProcessApplication(app.id, 'rejected')}
                                        disabled={loadingAction === app.id}
                                        className="flex-1"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                {Object.entries(app.answers).map(([question, answer]) => (
                                    <div key={question}>
                                        <p className="text-xs font-semibold text-muted-foreground">{question}</p>
                                        <p className="text-sm">{String(answer)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );

}

export default ClanApplicationsList;