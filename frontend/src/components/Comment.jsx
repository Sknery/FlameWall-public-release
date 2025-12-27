import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


import { MoreVertical, Edit, Trash2, Reply, Send, Loader2, User, Flag } from 'lucide-react';


import VoteButtons from './VoteButtons';
import ConfirmationModal from './ConfirmationModal';
import ReportModal from './ReportModal';
import { constructImageUrl } from '../utils/url';

const formatTimeShort = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

const Comment = ({ comment, onCommentAction, onVote, depth = 0, postData }) => {
    const { user: currentUser, authToken } = useAuth();

    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const replyTextareaRef = useRef(null);
    const editTextareaRef = useRef(null);

    useEffect(() => {
        if (isReplying && replyTextareaRef.current) {
            setTimeout(() => {
                replyTextareaRef.current?.focus();
            }, 50);
        }
    }, [isReplying]);

    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
            setTimeout(() => {
                const el = editTextareaRef.current;
                if (el) {
                    el.focus();
                    const val = el.value;
                    el.setSelectionRange(val.length, val.length);
                }
            }, 50);
        }
    }, [isEditing]);

    const canManage = currentUser && (currentUser.id === comment.author?.id || currentUser.rank?.power_level >= 800);

    const handleReplySubmit = async (e) => {
        if (e) e.preventDefault();
        if (!replyContent.trim()) return;
        setIsSubmitting(true);
        try {
            await axios.post(
                `/api/posts/${comment.postId}/comments`,
                { content: replyContent, parentId: comment.id },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            setReplyContent('');
            setIsReplying(false);
            onCommentAction();
            toast.success("Reply posted!");
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post reply.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!editContent.trim()) return;
        setIsSubmitting(true);
        try {
            await axios.patch(
                `/api/comments/${comment.id}`,
                { content: editContent },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            setIsEditing(false);
            onCommentAction();
            toast.success("Comment updated!");
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await axios.delete(`/api/comments/${comment.id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            onCommentAction();
            toast.success("Comment deleted.");
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete comment.');
        } finally {
            setIsSubmitting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleKeyDown = (e, submitFn, contentSetter) => {
        if (e.key === 'Enter') {
            if (e.shiftKey || e.ctrlKey) {
                 if (e.ctrlKey) {
                    e.preventDefault();
                    contentSetter(prev => prev + "\n");
                }
                return;
            }
            e.preventDefault();
            submitFn();
        } else if (e.key === 'Escape' && isEditing) {
            setIsEditing(false);
            setEditContent(comment.content);
        }
    };

    const nestedComments = (comment.children || []).map(child => (
        <Comment key={child.id} comment={child} onCommentAction={onCommentAction} onVote={onVote} depth={depth + 1} postData={postData} />
    ));

    return (
        <div>
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4, my-2">
                        <RouterLink to={`/users/${comment.author?.profile_slug || comment.author?.id}`}>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.author ? constructImageUrl(comment.author.pfp_url) : ''} />
                                <AvatarFallback>
                                    <User className={cn(depth > 0 ? "h-4 w-4" : "h-5 w-5")} />
                                </AvatarFallback>
                            </Avatar>
                        </RouterLink>

                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <button onClick={() => setIsCollapsed(!isCollapsed)} className="flex items-center gap-2">
                                <p className="text-sm font-semibold" style={{ color: comment.author?.rank?.display_color }}>
                                    {comment.author ? comment.author.username : '[Deleted]'}
                                </p>
                                 <p className="text-xs text-muted-foreground shrink-0 hover:underline">
                                     {formatTimeShort(comment.createdAt)}
                                </p>
                            </button>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canManage && (
                                <>
                                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                        <Edit className="mr-2 h-4 w-4" />Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                            {!canManage && currentUser && (
                                <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}>
                                    <Flag className="mr-2 h-4 w-4" />Report
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {!isCollapsed && (
                    <div className="pl-1 mt-1 space-y-2">
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <Textarea
                                    ref={editTextareaRef}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleEditSubmit, setEditContent)}
                                    className="min-h-[60px]"
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditContent(comment.content); }}>Cancel</Button>
                                    <Button size="sm" onClick={handleEditSubmit} disabled={isSubmitting}>Save</Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                        )}

                        {!isEditing && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <VoteButtons
                                    initialScore={comment.score}
                                    currentUserVote={comment.currentUserVote}
                                    onVote={(value) => onVote('comment', comment.id, value)}
                                    disabled={!currentUser}
                                />
                                {currentUser && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsReplying(!isReplying)}>
                                        <Reply className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {isReplying && !isEditing && (
                            <form onSubmit={handleReplySubmit} className="flex gap-2 pt-2">
                                <Textarea
                                    ref={replyTextareaRef}
                                    placeholder={`Replying to ${comment.author?.username}...`}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleReplySubmit, setReplyContent)}
                                    rows={1}
                                />
                                <Button type="submit" size="icon" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {!isCollapsed && nestedComments.length > 0 && (
                <div className="pl-3 sm:pl-8 mt-2 border-l border-border space-y-4">
                    {nestedComments}
                </div>
            )}

            <ConfirmationModal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Comment"
                content="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText="Delete"
                confirmColor="destructive"
                loading={isSubmitting}
            />
            <ReportModal
                open={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                type="COMMENT"
                targetId={comment.id}
                targetName={`Comment by ${comment.author?.username || 'Anonymous'}`}
                entityData={{
                    content: comment.content,
                    author: comment.author,
                    postId: comment.postId,
                    postTitle: postData?.title,
                }}
            />
        </div>
    );
};

export default Comment;