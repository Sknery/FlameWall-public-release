

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ChevronsRight, Send, Reply, X, Edit, Trash2, User, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { constructImageUrl } from '@/utils/url';
import ConfirmationModal from './ConfirmationModal';
import { cn } from '@/lib/utils';

const MessageBubble = ({ msg, onReply, onEdit, onDelete, onReplyLinkClick, currentUser, isConsecutive }) => {
    const isOwn = msg.author?.id === currentUser?.id;
    const canTakeAction = !!msg.author;

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

    const handleBubbleClick = (e) => {
        if (!canTakeAction) return;
        setIsMenuOpen(true);
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
                    <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-medium" style={{ color: msg.author?.rank?.display_color }}>
                        {msg.author?.username || '[deleted]'}
                    </span>
                )}

                <div
                    onClick={handleBubbleClick}
                    className={cn(
                        "relative group rounded-2xl px-3 py-2 text-sm shadow-sm cursor-pointer transition-all select-none touch-pan-y break-words",
                        isOwn
                            ? "bg-secondary text-secondary-foreground rounded-br-sm hover:bg-secondary/80"
                            : "bg-muted hover:bg-muted/80 rounded-bl-sm"
                    )}
                >
                    {msg.parent && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onReplyLinkClick(e, msg.parent.id);
                            }}
                            className="block w-full text-left bg-background/20 p-1.5 rounded mb-1 hover:bg-background/30 transition-colors border-l-2 border-primary/50 text-xs cursor-pointer relative z-10"
                        >
                            <p className="font-semibold opacity-70">{msg.parent.author?.username || '[deleted]'}</p>
                            <p className="opacity-60 line-clamp-1">{msg.parent.content}</p>
                        </div>
                    )}

                    <p className="whitespace-pre-wrap leading-snug">{msg.content}</p>

                    {canTakeAction && (
                        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
                            <DropdownMenuTrigger className="w-px h-px opacity-0 absolute bottom-0 right-0 pointer-events-none" />
                            <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-48 z-[100]">
                                <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onReply(msg))}>
                                    <Reply className="mr-2 h-4 w-4" /> Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopy}>
                                    <Copy className="mr-2 h-4 w-4" /> Copy Text
                                </DropdownMenuItem>
                                {isOwn && (
                                    <>
                                        <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onEdit(msg))}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onDelete(msg))} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    );
};


function ClanChatWidget({ onToggle, isMobile }) {
    const { user: currentUser, socket, isLoggedIn } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const clanId = currentUser?.clanMembership?.clan_id;

    useEffect(() => {
        if (!socket || !isLoggedIn || !clanId) return;

        socket.emit('joinClanChat', { clanId });
        socket.emit('requestClanChatHistory', { clanId });

        const handleHistory = (data) => {
            if (data.clanId === clanId && data.messages) {
                setMessages(data.messages);
            }
        };
        const handleNewMessage = (message) => {
            if (message.clan_id === clanId) setMessages(prev => [...prev, message]);
        };
        const handleMessageUpdated = (updatedMessage) => {
            if (updatedMessage.clan_id === clanId) {
                setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
            }
        };
        const handleError = (error) => toast.error(error.message);
        const handleFeedback = (feedback) => {
            if (feedback.type === 'success') toast.success(feedback.message);
        };

        socket.on('clanChatHistory', handleHistory);
        socket.on('newClanMessage', handleNewMessage);
        socket.on('clanMessageUpdated', handleMessageUpdated);
        socket.on('clanChatError', handleError);
        socket.on('clanChatFeedback', handleFeedback);

        return () => {
            socket.emit('leaveClanChat', { clanId });
            socket.off('clanChatHistory', handleHistory);
            socket.off('newClanMessage', handleNewMessage);
            socket.off('clanMessageUpdated', handleMessageUpdated);
            socket.off('clanChatError', handleError);
            socket.off('clanChatFeedback', handleFeedback);
        };
    }, [socket, isLoggedIn, clanId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if ((replyingTo || editingMessage) && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo, editingMessage]);

    const handleSendMessage = (e) => {
        if(e) e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        if (editingMessage) {
            socket.emit('editClanMessage', {
                clanId,
                messageId: editingMessage.id,
                content: newMessage,
            });
        } else {
            socket.emit('sendClanMessage', {
                clanId,
                content: newMessage,
                channel: 'general',
                parentId: replyingTo ? replyingTo.id : undefined,
            });
        }

        setNewMessage('');
        setReplyingTo(null);
        setEditingMessage(null);
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

    const handleStartEdit = (message) => {
        setEditingMessage(message);
        setNewMessage(message.content);
        setReplyingTo(null);
    };

    const handleStartDelete = (message) => {
        setMessageToDelete(message);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!messageToDelete || !socket) return;
        setIsActionLoading(true);
        socket.emit('deleteClanMessage', {
            clanId,
            messageId: messageToDelete.id,
        });
        setIsActionLoading(false);
        setIsConfirmOpen(false);
        setMessageToDelete(null);
    };

    const onReplyLinkClick = (event, messageId) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const cancelActions = () => {
        setNewMessage('');
        setReplyingTo(null);
        setEditingMessage(null);
    };

    if (!currentUser?.clanMembership) {
        return (
            <Card className="h-full w-full flex flex-col shadow-2xl bg-[#09090b] border-white/10">
                <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-white/10">
                    <h3 className="font-semibold">Clan Chat</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                        {isMobile ? <X className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">You are not in a clan.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="h-full w-full flex flex-col shadow-2xl bg-[#09090b] border-white/10">
                <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-white/10">
                    <h3 className="font-semibold truncate max-w-[200px]">{currentUser.clanMembership.clan.name}</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onToggle}>
                        {isMobile ? <X className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 p-3 overflow-y-auto">
                    <div className="flex flex-col pb-2">
                        {messages.filter(m => m.channel === 'general').map((msg, index, arr) => {
                             const isConsecutive = index > 0 &&
                                arr[index - 1].author?.id === msg.author?.id &&
                                (new Date(msg.created_at) - new Date(arr[index - 1].created_at) < 300000);

                            return (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    onReply={setReplyingTo}
                                    onEdit={handleStartEdit}
                                    onDelete={handleStartDelete}
                                    onReplyLinkClick={onReplyLinkClick}
                                    currentUser={currentUser}
                                    isConsecutive={isConsecutive}
                                />
                            )
                        })}
                    </div>
                    <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-3 border-t bg-background">
                    {(replyingTo || editingMessage) && (
                        <div className="relative bg-accent/50 p-2 rounded-t-md text-sm mb-2 border-l-4 border-primary">
                            <p className="font-semibold text-xs text-primary">{editingMessage ? 'Editing message' : `Replying to ${replyingTo.author?.username}`}</p>
                            {!editingMessage && <p className="text-muted-foreground truncate text-xs">{replyingTo.content}</p>}
                            <button onClick={cancelActions} className="absolute top-1 right-1 p-1 rounded-full hover:bg-background"><X className="h-3 w-3" /></button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="relative">
                        <Textarea
                            ref={textareaRef}
                            placeholder="Type a message..."
                            className="pr-12 resize-none min-h-[40px]"
                            minRows={1} maxRows={4}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') cancelActions();
                                handleKeyDown(e);
                            }}
                        />
                        <Button type="submit" size="icon" className="absolute right-2.5 bottom-2 h-7 w-7" disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
            <ConfirmationModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Message Deletion"
                content={`Are you sure you want to delete this message?`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isActionLoading}
            />
        </>
    );
}

export default ClanChatWidget;