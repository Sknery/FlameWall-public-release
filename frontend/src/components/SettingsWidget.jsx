
import React from 'react';


import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsRight, X } from 'lucide-react';


import SettingsPage from '../pages/SettingsPage';

function SettingsWidget({ onToggle, isMobile }) {
    return (
        <Card className="h-full w-full flex flex-col shadow-2xl bg-[#09090b] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-white/10">
                <h3 className="font-semibold">Settings</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                    {isMobile ? <X className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4 md:p-6">
                    {}
                    <SettingsPage isWidgetMode={true} />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default SettingsWidget;