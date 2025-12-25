import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

function MinecraftAvatar({ user, size = 32, className }) {
    if (user && user.minecraft_uuid) {
        const avatarUrl = `https://mc-heads.net/avatar/${user.minecraft_uuid}/64`;

        return (
            <Avatar className={cn('rounded-md', className)} style={{ width: size, height: size }}>
                <AvatarImage src={avatarUrl} alt={user.username} style={{ imageRendering: 'pixelated' }} />
                <AvatarFallback className="rounded-md">{user.username?.charAt(0)}</AvatarFallback>
            </Avatar>
        );
    }

    return (
        <Avatar className={cn('rounded-md', className)} style={{ width: size, height: size }}>
            <AvatarFallback className="rounded-md bg-muted">
                <User className="h-[60%] w-[60%]" />
            </AvatarFallback>
        </Avatar>
    );
}

export default MinecraftAvatar;
