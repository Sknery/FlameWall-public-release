

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import axios from 'axios';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Reply, Edit, Trash2, Send, Loader2, Terminal, X, User, MessageSquare, Copy, Settings, AlignLeft, AlignRight, Split } from 'lucide-react';
import { constructImageUrl } from '@/utils/url';
import { cn } from '@/lib/utils';
import UserProfileSidebar from '../components/UserProfileSidebar';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import VerifiedIcons from '../components/VerifiedIcons';
import { Separator } from '@/components/ui/separator';

const MessageBubble = ({ msg, isOwn, isConsecutive, onReply, onEdit, onDelete, onReplyLinkClick, currentUser, alignmentMode = 'split' }) => {
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

    const handleBubbleClick = () => {
        if (!msg.is_deleted) {
            setIsMenuOpen(true);
        }
    };

    // Determine alignment based on mode
    const getAlignment = () => {
        if (alignmentMode === 'left') return 'justify-start';
        if (alignmentMode === 'right') return 'justify-end';
        // Default 'split' mode
        return isOwn ? 'justify-end' : 'justify-start';
    };

    const shouldShowAvatar = () => {
        if (alignmentMode === 'left') return !isConsecutive;
        if (alignmentMode === 'right') return false;
        // Default 'split' mode
        return !isOwn && !isConsecutive;
    };

    const shouldShowAvatarRight = () => {
        if (alignmentMode === 'left') return false;
        if (alignmentMode === 'right') return !isConsecutive;
        // Default 'split' mode
        return isOwn && !isConsecutive;
    };

    // Determine if we need to reserve space for avatar (for alignment)
    const shouldReserveAvatarSpace = () => {
        if (alignmentMode === 'left') return true; // Always reserve space on left
        if (alignmentMode === 'right') return false; // Never reserve space on left
        // Default 'split' mode
        return !isOwn; // Reserve space on left for others' messages
    };

    const shouldReserveAvatarSpaceRight = () => {
        if (alignmentMode === 'left') return false; // Never reserve space on right
        if (alignmentMode === 'right') return true; // Always reserve space on right
        // Default 'split' mode
        return isOwn; // Reserve space on right for own messages
    };

    const getContentAlignment = () => {
        if (alignmentMode === 'left') return 'items-start';
        if (alignmentMode === 'right') return 'items-end';
        // Default 'split' mode
        return isOwn ? 'items-end' : 'items-start';
    };

    const getBubbleStyles = () => {
        if (alignmentMode === 'left') {
            return cn(
                "bg-muted rounded-bl-sm",
                isConsecutive && "rounded-tl-md"
            );
        }
        if (alignmentMode === 'right') {
            return cn(
                "bg-secondary text-secondary-foreground rounded-br-sm",
                isConsecutive && "rounded-tr-md"
            );
        }
        // Default 'split' mode
        return cn(
            isOwn 
                ? "bg-secondary text-secondary-foreground rounded-br-sm"
                : "bg-muted rounded-bl-sm",
            isConsecutive && (isOwn ? "rounded-tr-md" : "rounded-tl-md")
        );
    };

    return (
        <div
            id={`msg-${msg.id}`}
            className={cn(
                "flex items-start gap-2 sm:gap-3 max-w-full transition-all",
                getAlignment(),
                isConsecutive ? "mt-1" : "mt-7"
            )}
        >
            {shouldReserveAvatarSpace() && (
                <div className="shrink-0 w-8">
                    {shouldShowAvatar() ? (
                        <Avatar className={cn("h-8 w-8", isConsecutive ? "invisible" : "")}>
                            <AvatarImage src={constructImageUrl(msg.sender?.pfp_url)} />
                            <AvatarFallback>
                                <User className="h-[60%] w-[60%]" />
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-8 w-8" />
                    )}
                </div>
            )}

            <div className={cn("flex flex-col max-w-[85%] sm:max-w-[70%]", getContentAlignment())}>
                {!isConsecutive && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1 font-medium" style={{ color: msg.sender?.rank?.display_color }}>
                        {msg.sender?.username || '[Deleted User]'}
                    </p>
                )}

                <div
                    onClick={handleBubbleClick}
                    className={cn(
                        "group relative rounded-2xl px-4 py-2 text-sm shadow-sm cursor-pointer transition-all select-none touch-pan-y",
                        msg.is_deleted ? "italic text-muted-foreground border cursor-default" : "hover:brightness-95",
                        getBubbleStyles()
                    )}
                >

                    {msg.parentMessage && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onReplyLinkClick(e, msg.parentMessage.id);
                            }}
                            className={cn("block w-full text-left px-2 py-1 mb-2 text-xs transition-colors border-l-2 bg-black/5 border-primary/30 hover:bg-black/10 touch-pan-y")}
                        >
                            <p className="font-bold opacity-90">{msg.parentMessage.sender?.username || '[Deleted User]'}</p>
                            <p className="opacity-80 line-clamp-1">{msg.parentMessage.content}</p>
                        </div>
                    )}

                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                        {wasEdited && <span className="text-[10px] opacity-70 ml-2 align-bottom">(edited)</span>}
                    </p>

                    {!msg.is_deleted && (
                        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
                            <DropdownMenuTrigger
                                className={cn(
                                    "w-px h-px opacity-0 absolute bottom-0 pointer-events-none",
                                    isOwn ? "right-0" : "left-0"
                                )}
                            />
                            <DropdownMenuContent align={alignmentMode === 'right' ? "end" : alignmentMode === 'left' ? "start" : (isOwn ? "end" : "start")} className="z-[100]">
                                <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onReply(msg))}><Reply className="mr-2 h-4 w-4" /> Reply</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopy}><Copy className="mr-2 h-4 w-4" /> Copy</DropdownMenuItem>
                                {isOwn && (
                                    <>
                                        <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onEdit(msg))}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleMenuAction(e, () => onDelete(msg.id))} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
            {shouldReserveAvatarSpaceRight() && (
                <div className="shrink-0 w-8">
                    {shouldShowAvatarRight() ? (
                        <Avatar className={cn("h-8 w-8", isConsecutive ? "invisible" : "")}>
                            <AvatarImage src={constructImageUrl(currentUser?.pfp_url)} />
                            <AvatarFallback>
                                <User className="h-[60%] w-[60%]" />
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-8 w-8" />
                    )}
                </div>
            )}
        </div>
    );
};

function ConversationPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { setLayoutOptions } = useOutletContext();
    const { user: currentUser, authToken, socket } = useAuth();
    const { markNotificationsAsReadByLink } = useNotifications();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [conversation, setConversation] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [friendshipStatus, setFriendshipStatus] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const messagesEndRef = useRef(null);

    const textareaRef = useRef(null);

    // Message alignment mode: 'split' (default), 'left', or 'right'
    const [messageAlignment, setMessageAlignment] = useState(() => {
        const saved = localStorage.getItem('messageAlignment');
        return saved || 'split';
    });

    const handleAlignmentChange = (mode) => {
        setMessageAlignment(mode);
        localStorage.setItem('messageAlignment', mode);
    };

    useEffect(() => {
        if ((replyingToMessage || editingMessage) && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingToMessage, editingMessage]);

    const scrollToBottom = useCallback((behavior = 'auto') => { messagesEndRef.current?.scrollIntoView({ behavior }); }, []);

    useEffect(() => {
        setLayoutOptions({ noPadding: true, hasBottomPadding: false });
        return () => setLayoutOptions({ noPadding: false, hasBottomPadding: true });
    }, [setLayoutOptions]);

    const fetchConversation = useCallback(async () => {
        if (!userId || !authToken) return;
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const [convoRes, userRes, friendshipRes] = await Promise.all([axios.get(`/api/messages/${userId}`, config), axios.get(`/api/users/${userId}`, config).catch(() => null), axios.get(`/api/friendships/status/${userId}`, config)]);
            setConversation(convoRes.data);
            setOtherUser(userRes ? userRes.data : { id: userId, username: '[Deleted User]' });
            setFriendshipStatus(friendshipRes.data.status);
            markNotificationsAsReadByLink(`/messages/${userId}`);
            axios.post(`/api/messages/${userId}/read`, {}, config);
        } catch (err) { setError(err.response?.data?.message || 'Failed to load conversation.'); } finally { setLoading(false); }
    }, [userId, authToken, markNotificationsAsReadByLink]);

    useEffect(() => { setLoading(true); fetchConversation(); }, [fetchConversation]);

    useEffect(() => {
        if (otherUser) {
            setBreadcrumbs([
                { label: 'My Profile', link: '/profile/me' },
                { label: 'Messages', link: '/messages' },
                { label: otherUser.username }
            ]);
        }
        return () => setBreadcrumbs([]);
    }, [otherUser, setBreadcrumbs]);

    useEffect(() => {
        if (!socket || !currentUser) return;
        const handleNewMessage = (newMessage) => { const otherId = newMessage.sender.id === currentUser.id ? newMessage.receiver.id : newMessage.sender.id; if (String(otherId) === String(userId)) setConversation(prev => [...prev.filter(m => m.id !== newMessage.id), newMessage]); };
        const handleMessageUpdated = (updatedMessage) => { const otherId = updatedMessage.sender.id === currentUser.id ? updatedMessage.receiver.id : updatedMessage.sender.id; if (String(otherId) === String(userId)) setConversation(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)); };
        socket.on('newMessage', handleNewMessage);
        socket.on('messageUpdated', handleMessageUpdated);
        socket.on('chatError', (error) => toast.error(error.message));
        return () => { socket.off('newMessage', handleNewMessage); socket.off('messageUpdated', handleMessageUpdated); socket.off('chatError'); };
    }, [socket, currentUser, userId]);

    useEffect(() => { scrollToBottom(); }, [conversation, scrollToBottom]);

    const handleFormSubmit = (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !socket || friendshipStatus !== 'ACCEPTED') return;
        const payload = editingMessage ? { messageId: editingMessage.id, content: newMessage } : { content: newMessage, recipientId: Number(userId), parentMessageId: replyingToMessage ? replyingToMessage.id : null };
        socket.emit(editingMessage ? 'editMessage' : 'sendMessage', payload);
        cancelActions();
        setTimeout(() => scrollToBottom('smooth'), 100);
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
            handleFormSubmit();
        }
    };

    const handleEditClick = (message) => { setEditingMessage(message); setNewMessage(message.content); setReplyingToMessage(null); };
    const handleReplyClick = (message) => { setReplyingToMessage(message); setEditingMessage(null); };
    const handleDeleteClick = (messageId) => { if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) socket.emit('deleteMessage', { messageId }); };
    const cancelActions = () => { setEditingMessage(null); setReplyingToMessage(null); setNewMessage(''); };
    const onReplyLinkClick = (e, msgId) => { if(e) e.preventDefault(); document.getElementById(`msg-${msgId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!otherUser) return null;

    const canSendMessage = friendshipStatus === 'ACCEPTED' || Number(otherUser.id) === currentUser.id;

    return (
        <div className="flex flex-col md:grid md:grid-cols-[1fr_20rem] h-full w-full  overflow-hidden md:px-4">

            <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 relative overflow-hidden">

                <header className="flex items-center justify-between p-3 shrink-0 backdrop-blur z-10 shadow-sm">
                    <div className="flex items-center flex-1 min-w-0">
                        <Button variant="ghost" size="icon" className="mr-2 shrink-0" onClick={() => navigate('/messages')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-10 w-10 border shrink-0">
                            <AvatarImage src={constructImageUrl(otherUser.pfp_url)} />
                            <AvatarFallback>
                                <User className="h-[60%] w-[60%]" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="ml-3 min-w-0">
                            <div className="font-bold text-sm flex items-center gap-1">
                                {otherUser.username}
                                <VerifiedIcons user={otherUser} />
                            </div>
                            <p className="text-xs text-muted-foreground" style={{ color: otherUser.rank?.display_color }}>
                                {otherUser.rank?.name}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-2 shrink-0">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[100]">
                            <DropdownMenuItem onClick={() => handleAlignmentChange('split')} className={messageAlignment === 'split' ? 'bg-muted' : ''}>
                                <Split className="mr-2 h-4 w-4" />
                                Split (own right, others left)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAlignmentChange('left')} className={messageAlignment === 'left' ? 'bg-muted' : ''}>
                                <AlignLeft className="mr-2 h-4 w-4" />
                                All left
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAlignmentChange('right')} className={messageAlignment === 'right' ? 'bg-muted' : ''}>
                                <AlignRight className="mr-2 h-4 w-4" />
                                All right
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <Separator />
                <main className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-secondary">
                    {conversation.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
                             <MessageSquare className="h-12 w-12" />
                             <p>No messages here yet.</p>
                             <p className="text-xs">Say hello!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col pb-2">
                            {conversation.map((msg, index) => (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    isOwn={msg.sender?.id === currentUser?.id}
                                    isConsecutive={index > 0 && conversation[index - 1].sender?.id === msg.sender?.id && !conversation[index - 1].is_deleted && (new Date(msg.sent_at) - new Date(conversation[index - 1].sent_at) < 60000)}
                                    onReply={handleReplyClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                    onReplyLinkClick={onReplyLinkClick}
                                    currentUser={currentUser}
                                    alignmentMode={messageAlignment}
                                />
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-3 bg-black shrink-0">
                    {(replyingToMessage || editingMessage) && (
                        <div className="relative bg-muted/80 backdrop-blur p-2 rounded-t-lg text-sm mb-2 border-l-4 border-primary animate-in slide-in-from-bottom-2">
                            <p className="font-semibold text-xs text-primary">{editingMessage ? 'Editing message' : `Replying to ${replyingToMessage.sender?.username}`}</p>
                            {!editingMessage && <p className="text-muted-foreground truncate text-xs mt-0.5">{replyingToMessage.content}</p>}
                            <button onClick={cancelActions} className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"><X className="h-3 w-3" /></button>
                        </div>
                    )}
                    <form onSubmit={handleFormSubmit} className="flex gap-2 items-end">
                        <div className="relative flex-1">
                            <Textarea
                                ref={textareaRef}
                                placeholder={canSendMessage ? "Type a message..." : "You can only message your friends."}
                                className="min-h-[44px] max-h-[150px] py-3 px-4 resize-none rounded-2xl border-muted-foreground/20 focus-visible:ring-1 bg-muted/30 hover:bg-muted/50 transition-colors"
                                rows={1}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') cancelActions();
                                    handleKeyDown(e);
                                }}
                                disabled={!canSendMessage}
                            />
                        </div>
                        <Button type="submit" size="icon" className="h-11 w-11 rounded-full shrink-0" disabled={!newMessage.trim() || !canSendMessage}>
                            <Send className="h-5 w-5 ml-0.5" />
                        </Button>
                    </form>
                </footer>
            </div>

            <div className="hidden md:block md:w-80 md:shrink-0 h-full min-h-0 overflow-y-auto p-4 bg-muted/10">
                <UserProfileSidebar user={otherUser} />
            </div>
        </div>
    );
}

export default ConversationPage;