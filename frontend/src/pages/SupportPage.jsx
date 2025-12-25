

import React, { useEffect } from 'react';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from 'lucide-react';

function SupportPage() {
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([ { label: 'Support' } ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold">Support & Contacts</h1>

            <Card>
                <CardHeader>
                    <CardTitle>How to Get Help</CardTitle>
                    <CardDescription>
                        If you encounter any issues with the website, payments, or have questions about the game server, please contact us via email.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            For issues, business inquiries, or questions, please contact us via email. Please note that response times may vary as this is a solo project.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href="mailto:sknery.official@gmail.com" className="text-sm font-medium hover:underline">
                                sknery.official@gmail.com
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default SupportPage;
