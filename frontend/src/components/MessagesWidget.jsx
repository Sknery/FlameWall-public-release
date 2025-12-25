import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';


import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
    Loader2, User, Send, ArrowLeft, MoreVertical, 
    Reply, Copy, Edit, Trash2, X, MessageSquare 
} from 'lucide-react';


import { constructImageUrl } from '../utils/url';
import ConfirmationModal from './ConfirmationModal';

const MessageBubble = ({ msg, isOwn, isConsecutive, onReply, onEdit, onDelete, onReplyLinkClick, currentUser }) => {
    const wasEdited = !msg.is_deleted && (new Date(msg.updated_at).getTime() - new Date(msg.sent_at).getTime() > 10000);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const handleMenuAction = (e, action) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setIsMenuOpen(false);
        if (action) action();
    };

    const handleCopy = (e) => {
        handleMenuAction(e, () => {
             navigator.clipboard.writeText(msg.content);
             toast.success("Text copied");
        });
    };

    return (
        <div 
            id={`widget-msg-${msg.id}`} 
            className={cn(
                "flex items-end gap-2 mb-1", 
                isOwn ? "justify-end" : "justify-start",
                isConsecutive ? "mt-0.5" : "mt-3" 
            )}
        >
            {!isOwn && !isConsecutive && (
                <Avatar className="h-6 w-6 shrink-0 mb-1">
                    <AvatarImage src={constructImageUrl(msg.sender?.pfp_url)} />
                    <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                </Avatar>
            )}
            {!isOwn && isConsecutive && <div className="w-6 shrink-0" />}
            
            <div className={cn("flex flex-col max-w-[80%]", isOwn && "items-end")}>
                <div 
                    onClick={() => !msg.is_deleted && setIsMenuOpen(true)}
                    className={cn(
                        "group relative rounded-2xl px-3 py-2 text-sm shadow-sm cursor-pointer transition-all select-none touch-pan-y break-words", 
                        msg.is_deleted ? "italic text-muted-foreground border cursor-default bg-muted/50" : "hover:brightness-95", 
                        isOwn ? "bg-muted rounded-br-sm text-foreground" : "bg-muted rounded-bl-sm",
                        isConsecutive && (isOwn ? "rounded-tr-md" : "rounded-tl-md")
                    )}
                >
                    {msg.parentMessage && (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                onReplyLinkClick(e, msg.parentMessage.id);
                            }} 
                            className={cn(
                                "block w-full text-left px-2 py-1 mb-1 text-xs rounded transition-colors border-l-2 cursor-pointer opacity-80",
                                isOwn ? "bg-black/5 border-white/30 hover:bg-black/10" : "bg-black/5 border-primary/30 hover:bg-black/10"
                            )}
                        >
                            <p className="font-bold truncate">{msg.parentMessage.sender?.username || '[Deleted]'}</p>
                            <p className="truncate opacity-80">{msg.parentMessage.content}</p>
                        </div>
                    )}
                    
                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                        {msg.content}
                        {wasEdited && <span className="text-[10px] opacity-70 ml-1 align-bottom">(edited)</span>}
                    </p>

                    {!msg.is_deleted && (
                        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
                            <DropdownMenuTrigger className="w-px h-px opacity-0 absolute bottom-0 right-0 pointer-events-none" />
                            <DropdownMenuContent align={isOwn ? "end" : "start"} className="z-[100] w-40">
                                <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onReply(msg))}><Reply className="mr-2 h-3.5 w-3.5" /> Reply</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopy}><Copy className="mr-2 h-3.5 w-3.5" /> Copy</DropdownMenuItem>
                                {isOwn && (
                                    <>
                                        <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onEdit(msg))}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onDelete(msg.id))} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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

function MessagesWidget() {
    const { authToken, socket, user: currentUser } = useAuth();
    
    const [view, setView] = useState('list');
    const [conversations, setConversations] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [msgToDelete, setMsgToDelete] = useState(null);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        if (!authToken) return;
        try {
            const response = await axios.get('/api/messages/list', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setConversations(response.data);
        } catch (err) {
            console.error("Failed to load conversations:", err);
        } finally {
            setLoadingList(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const loadChat = async (otherUser) => {
        setActiveUser(otherUser);
        setView('chat');
        setLoadingChat(true);
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const response = await axios.get(`/api/messages/${otherUser.id}`, config);
            setChatMessages(response.data);
            
            await axios.post(`/api/messages/${otherUser.id}/read`, {}, config);
            
            setConversations(prev => prev.map(c => 
                c.otherUser.id === otherUser.id ? { ...c, unreadCount: 0 } : c
            ));
            
            setTimeout(() => scrollToBottom('auto'), 0); 
            
        } catch (err) {
            toast.error("Failed to load messages.");
            setView('list');
        } finally {
            setLoadingChat(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            if (view === 'chat' && activeUser && (msg.sender_id === activeUser.id || msg.receiver_id === activeUser.id)) {
                setChatMessages(prev => [...prev, msg]);
                scrollToBottom('smooth');
                
                if (msg.sender_id === activeUser.id) {
                    axios.post(`/api/messages/${activeUser.id}/read`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
                }
            }
            fetchConversations();
        };

        const handleMessageUpdated = (updatedMsg) => {
            if (view === 'chat' && activeUser) {
                setChatMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
            }
             fetchConversations();
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('messageUpdated', handleMessageUpdated);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messageUpdated', handleMessageUpdated);
        };
    }, [socket, view, activeUser, authToken, fetchConversations]);

    useLayoutEffect(() => {
        if (view === 'chat' && !loadingChat) {
            scrollToBottom('auto');
        }
    }, [view, loadingChat, chatMessages]);

    const scrollToBottom = (behavior = 'auto') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        }
    };

    const handleBackToList = () => {
        setView('list');
        setActiveUser(null);
        setChatMessages([]);
        setNewMessage('');
        cancelActions();
        fetchConversations();
    };

    const handleSendMessage = (e) => {
        if(e) e.preventDefault();
        if (!newMessage.trim() || !socket || !activeUser) return;

        const payload = editingMessage 
            ? { messageId: editingMessage.id, content: newMessage } 
            : { content: newMessage, recipientId: activeUser.id, parentMessageId: replyingTo ? replyingTo.id : null };

        socket.emit(editingMessage ? 'editMessage' : 'sendMessage', payload);
        
        setNewMessage('');
        cancelActions();
    };

    const handleDelete = () => {
        if (!msgToDelete || !socket) return;
        socket.emit('deleteMessage', { messageId: msgToDelete.id });
        setIsConfirmOpen(false);
        setMsgToDelete(null);
    };

    const cancelActions = () => {
        setReplyingTo(null);
        setEditingMessage(null);
        setNewMessage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const onReplyLinkClick = (e, msgId) => {
        if(e) e.preventDefault();
        document.getElementById(`widget-msg-${msgId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (view === 'list') {
        if (loadingList) return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

        if (conversations.length === 0) return <p className="text-sm text-muted-foreground text-center py-10">No conversations yet.</p>;

        return (
            <div className="flex flex-col gap-1">
                {conversations.slice(0, 10).map(({ otherUser, lastMessage, unreadCount }) => (
                    <button
                        key={otherUser.id}
                        onClick={() => loadChat(otherUser)}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors text-left group w-full"
                    >
                        <div className="relative shrink-0">
                            <Avatar className="h-10 w-10 border border-border group-hover:border-primary/30 transition-colors">
                                <AvatarImage src={constructImageUrl(otherUser.pfp_url)} />
                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                            </Avatar>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-background">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold truncate text-sm">{otherUser.username}</p>
                                {lastMessage && (
                                    <p className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                        {formatDistanceToNow(new Date(lastMessage.sent_at), { addSuffix: false }).replace('about ', '').replace(' hours', 'h').replace(' minutes', 'm')}
                                    </p>
                                )}
                            </div>
                            <p className={cn("text-xs truncate mt-0.5", unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                                {lastMessage ? (
                                    <>{lastMessage.sender_id !== otherUser.id && "You: "}{lastMessage.content}</>
                                ) : <span className="italic">No messages</span>}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="absolute p-3 -inset-3 flex flex-col bg-background z-50 overflow-hidden rounded-xl border border-white/10">
            
            {}
            <div className="flex items-center gap-3 p-3 border-b bg-muted/10 shrink-0 z-10 h-14">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                {activeUser && (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar className="h-8 w-8 border">
                            <AvatarImage src={constructImageUrl(activeUser.pfp_url)} />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{activeUser.username}</p>
                            <p className="text-[10px] text-muted-foreground truncate" style={{color: activeUser.rank?.display_color}}>{activeUser.rank?.name}</p>
                        </div>
                    </div>
                )}
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-3 pr-3 scrollbar-thin scrollbar-thumb-secondary bg-background/50">
                {loadingChat ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 opacity-50">
                         <MessageSquare className="h-8 w-8 mb-2" />
                         <p className="text-xs">No messages yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col pb-2 min-h-full justify-end">
                        {chatMessages.map((msg, index) => {
                            const isOwn = currentUser?.id === msg.sender_id;
                            const isConsecutive = index > 0 && 
                                chatMessages[index - 1].sender_id === msg.sender_id &&
                                !chatMessages[index - 1].is_deleted &&
                                (new Date(msg.sent_at) - new Date(chatMessages[index - 1].sent_at) < 60000);

                            return (
                                <MessageBubble 
                                    key={msg.id} 
                                    msg={msg} 
                                    isOwn={isOwn}
                                    isConsecutive={isConsecutive}
                                    onReply={setReplyingTo}
                                    onEdit={(m) => { setEditingMessage(m); setNewMessage(m.content); setReplyingTo(null); textareaRef.current?.focus(); }}
                                    onDelete={(id) => { setMsgToDelete({ id }); setIsConfirmOpen(true); }}
                                    onReplyLinkClick={onReplyLinkClick}
                                    currentUser={currentUser}
                                />
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {}
            <div className="p-2 border-t bg-background/95 backdrop-blur shrink-0 z-10">
                {(replyingTo || editingMessage) && (
                    <div className="relative bg-accent/30 p-2 rounded-md mb-2 text-xs border-l-2 border-primary flex justify-between items-center">
                        <div className="truncate pr-6">
                            <span className="font-semibold text-primary">{editingMessage ? 'Editing:' : `Reply to ${replyingTo.sender?.username}:`}</span>
                            <span className="ml-1 text-muted-foreground truncate">{editingMessage ? '' : replyingTo.content}</span>
                        </div>
                        <button onClick={cancelActions} className="p-1 hover:bg-background rounded-full"><X className="h-3 w-3" /></button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <Textarea 
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..." 
                        className="min-h-[36px] max-h-[100px] py-2 px-3 text-sm resize-none rounded-xl bg-muted/30 focus-visible:ring-1"
                        rows={1}
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4 ml-0.5" />
                    </Button>
                </form>
            </div>
            
            <ConfirmationModal 
                open={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={handleDelete} 
                title="Delete Message" 
                content="Are you sure? This cannot be undone." 
                confirmText="Delete" 
                confirmColor="destructive" 
            />
        </div>
    );
}

export default MessagesWidget;