

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ChevronsRight, Send, Reply, X, User, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { constructImageUrl } from '@/utils/url';
import { cn } from '@/lib/utils';

const MessageBubble = ({ msg, isOwn, isConsecutive, onReply, onReplyLinkClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuAction = (e, action) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setIsMenuOpen(false);
        if (action) action();
    };

    const handleCopy = (e) => {
        handleMenuAction(e, () => {
            navigator.clipboard.writeText(msg.content);
            toast.success("Text copied!");
        });
    };

    const handleReplyAction = (e) => {
        handleMenuAction(e, () => {
            onReply(msg);
        });
    };

    return (
        <div
            id={`msg-${msg.id}`}
            className={cn(
                "flex items-end gap-2",
                isOwn ? "justify-end" : "justify-start",
                isConsecutive ? "mt-1" : "mt-4"
            )}
        >
            {!isOwn && (
                <Avatar className={cn("h-6 w-6 shrink-0 mb-1", isConsecutive ? "invisible" : "")}>
                    <AvatarImage src={constructImageUrl(msg.author?.pfp_url)} />
                    <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                </Avatar>
            )}

            <div className={cn("flex flex-col max-w-[85%]", isOwn && "items-end")}>
                {!isConsecutive && !isOwn && (
                    <RouterLink
                        to={`/users/${msg.author?.profile_slug || msg.author?.id}`}
                        className="text-[10px] text-muted-foreground mb-1 ml-1 font-medium hover:underline hover:text-primary transition-colors"
                        style={{ color: msg.author?.rank?.display_color }}
                    >
                        {msg.author?.username || 'System'}
                    </RouterLink>
                )}

                <div
                    onClick={() => setIsMenuOpen(true)}
                    className={cn(
                        "relative rounded-2xl px-3 py-2 text-sm shadow-sm cursor-pointer transition-all select-none touch-pan-y break-words",
                        isOwn
                            ? "bg-secondary text-secondary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                    )}
                >
                    {msg.parent && (
                        <div
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReplyLinkClick(e, msg.parent.id); }}
                            className="block w-full text-left bg-background/20 p-1.5 rounded-md mb-1 hover:bg-background/30 transition-colors border-l-2 border-primary/50 text-xs cursor-pointer"
                        >
                            <p className="font-bold opacity-70">{msg.parent.author?.username}</p>
                            <p className="opacity-60 line-clamp-1">{msg.parent.content}</p>
                        </div>
                    )}

                    <p className="whitespace-pre-wrap leading-snug">{msg.content}</p>

                    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
                         <DropdownMenuTrigger className="w-px h-px opacity-0 absolute bottom-0 left-0 pointer-events-none" />
                         <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-40 z-[100]">
                             <DropdownMenuItem onClick={handleReplyAction}>
                                <Reply className="mr-2 h-4 w-4" /> Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopy}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Text
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};

function GlobalChatWidget({ onToggle, isMobile }) {
    const { socket, isLoggedIn, user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [replyingTo, setReplyingTo] = useState(null);

    const textareaRef = useRef(null);

    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo]);

    useEffect(() => {
        if (!socket || !isLoggedIn) return;

        socket.emit('requestGlobalChatHistory');

        const handleHistory = (history) => {
            if (history) setMessages(history.slice().reverse());
        };
        const handleNewMessage = (message) => {
            setMessages(prev => [...prev, message]);
        };

        socket.on('globalChatHistory', handleHistory);
        socket.on('newGlobalMessage', handleNewMessage);

        return () => {
            socket.off('globalChatHistory', handleHistory);
            socket.off('newGlobalMessage', handleNewMessage);
        };
    }, [socket, isLoggedIn]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (newMessage.trim() && socket) {
            const payload = { content: newMessage, parentId: replyingTo ? replyingTo.id : undefined };
            socket.emit('sendGlobalMessage', payload);
            setNewMessage('');
            setReplyingTo(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey || e.ctrlKey) {
                if (e.ctrlKey) {
                    e.preventDefault();
                    setNewMessage(prev => prev + "\n");
                }
                return;
            }
            e.preventDefault();
            handleSendMessage();
        }
    };

    const onReplyLinkClick = (event, messageId) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (!isLoggedIn) return null;

    return (
        <Card className="h-full w-full flex flex-col shadow-2xl bg-[#09090b] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-white/10">
                <h3 className="font-semibold">Global Chat</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                    {isMobile ? <X className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-3 overflow-y-auto">
                <div className="flex flex-col pb-2">
                    {messages.map((msg, index) => {
                        const isOwn = currentUser?.id === msg.author?.id;
                        const isConsecutive = index > 0 &&
                            messages[index - 1].author?.id === msg.author?.id &&
                            (new Date(msg.created_at) - new Date(messages[index - 1].created_at) < 300000);

                        return (
                            <MessageBubble
                                key={msg.id}
                                msg={msg}
                                isOwn={isOwn}
                                isConsecutive={isConsecutive}
                                onReply={setReplyingTo}
                                onReplyLinkClick={onReplyLinkClick}
                            />
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-3 ">
                {replyingTo && (
                    <div className="relative bg-muted/50 p-2 rounded-t-md text-sm mb-2 border-l-4 border-primary">
                        <p className="font-semibold text-xs">Replying to {replyingTo.author?.username}</p>
                        <p className="text-muted-foreground truncate text-xs">{replyingTo.content}</p>
                        <button onClick={() => setReplyingTo(null)} className="absolute top-1 right-1 p-1 rounded-full hover:bg-background"><X className="h-3 w-3" /></button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="relative">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Type a message..."
                        className="pr-12 resize-none min-h-[40px]"
                        minRows={1}
                        maxRows={4}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <Button type="submit" size="icon" className="absolute right-2.5 bottom-2 h-7 w-7" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}

export default GlobalChatWidget;