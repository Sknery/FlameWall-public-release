import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { constructImageUrl } from '@/utils/url';
import { listContainer, fadeInUp } from '@/utils/animations';
import ReportPreview from '@/components/ReportPreview';

const TICKET_CATEGORIES = {
  TECHNICAL: 'Technical Issue',
  PAYMENT: 'Payment Issue',
  ACCOUNT: 'Account Issue',
  GAME_ISSUE: 'Game Issue',
  SUGGESTION: 'Suggestion',
  OTHER: 'Other',
};

const TICKET_STATUS = {
  OPEN: { label: 'Open', color: 'default', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'default', icon: Clock },
  WAITING_RESPONSE: { label: 'Waiting Response', color: 'default', icon: MessageSquare },
  RESOLVED: { label: 'Resolved', color: 'default', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'secondary', icon: XCircle },
};

const TICKET_PRIORITY = {
  LOW: { label: 'Low', color: 'secondary' },
  MEDIUM: { label: 'Medium', color: 'default' },
  HIGH: { label: 'High', color: 'destructive' },
  URGENT: { label: 'Urgent', color: 'destructive' },
};

function SupportPage() {
  const { authToken, user } = useAuth();
  const { setBreadcrumbs } = useBreadcrumbs();
  const isModerator = user?.rank?.power_level >= 800;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all' for moderators

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Support' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const fetchTickets = useCallback(async () => {
    if (!authToken) return;
    try {
      setLoading(true);
      const endpoint = isModerator && viewMode === 'all' 
        ? '/api/support/tickets' 
        : '/api/support/tickets/my';
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setTickets(response.data.tickets || response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [authToken, viewMode, isModerator]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/support/tickets', formData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Support ticket created successfully!');
      setCreateModalOpen(false);
      setFormData({ subject: '', message: '', category: 'TECHNICAL', priority: 'MEDIUM' });
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await axios.get(`/api/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setSelectedTicket(response.data);
      setViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load ticket details');
    }
  };

  const handleAddReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;
    try {
      await axios.post(
        `/api/support/tickets/${selectedTicket.id}/reply`,
        { message: newReply },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      toast.success('Reply added successfully!');
      setNewReply('');
      // Refresh ticket view and list, but don't show errors if these fail
      try {
        await handleViewTicket(selectedTicket.id);
      } catch (error) {
        console.error('Failed to refresh ticket view:', error);
      }
      try {
        await fetchTickets();
      } catch (error) {
        console.error('Failed to refresh tickets list:', error);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;
    try {
      await axios.post(
        `/api/support/tickets/${selectedTicket.id}/reopen`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      toast.success('Ticket reopened successfully!');
      // Refresh ticket view and list
      try {
        await handleViewTicket(selectedTicket.id);
      } catch (error) {
        console.error('Failed to refresh ticket view:', error);
      }
      try {
        await fetchTickets();
      } catch (error) {
        console.error('Failed to refresh tickets list:', error);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reopen ticket');
    }
  };

  const handleAddUserReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;
    try {
      await axios.post(
        `/api/support/tickets/${selectedTicket.id}/user-reply`,
        { message: newReply },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      toast.success('Reply added successfully!');
      setNewReply('');
      // Refresh ticket view and list, but don't show errors if these fail
      try {
        await handleViewTicket(selectedTicket.id);
      } catch (error) {
        console.error('Failed to refresh ticket view:', error);
      }
      try {
        await fetchTickets();
      } catch (error) {
        console.error('Failed to refresh tickets list:', error);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = TICKET_STATUS[status] || TICKET_STATUS.OPEN;
    const StatusIcon = statusInfo.icon;
    return (
      <Badge variant={statusInfo.color}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityInfo = TICKET_PRIORITY[priority] || TICKET_PRIORITY.MEDIUM;
    return (
      <Badge variant={priorityInfo.color}>{priorityInfo.label}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-sans text-3xl font-bold">Support & Tickets</h1>
        <div className="flex gap-2">
          {isModerator && (
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
              <TabsList>
                <TabsTrigger value="my">My Tickets</TabsTrigger>
                <TabsTrigger value="all">All Tickets</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No support tickets yet</h3>
            <p className="text-muted-foreground mb-4">
              If you need help, create a support ticket and we'll get back to you as soon as possible.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={listContainer}
          initial="initial"
          animate="animate"
          className="responsive-grid-posts"
        >
          {tickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              variants={fadeInUp}
              className="h-full w-full"
            >
              <Card 
                className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleViewTicket(ticket.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {ticket.user && (
                      <RouterLink 
                        to={`/users/${ticket.user.profile_slug || ticket.user.id}`} 
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={constructImageUrl(ticket.user.pfp_url)} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </RouterLink>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {ticket.user?.username || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                  <div className="block group flex-1" onClick={(e) => e.stopPropagation()}>
                    <h2 className="font-sans text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 mb-1 break-all">
                      {ticket.subject}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2 break-all">
                      {ticket.message}
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {TICKET_CATEGORIES[ticket.category]}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTicket(ticket.id);
                      }}
                    >
                      <MessageSquare className="mr-2 h-3.5 w-3.5" />
                      {ticket.replies?.length || 0}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Ticket Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleCreateTicket}>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll help you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Provide detailed information about your issue..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/5000 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Ticket Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle>{selectedTicket.subject}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {TICKET_CATEGORIES[selectedTicket.category]} • Created {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                      {isModerator && viewMode === 'all' && selectedTicket.user && (
                        <> • By {selectedTicket.user.username}</>
                      )}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
              </DialogHeader>
              <Separator />
              <div className="space-y-4">
                {/* Report Preview */}
                {selectedTicket.reportEntityType && (
                  <>
                    <ReportPreview ticket={selectedTicket} />
                    <Separator />
                  </>
                )}
                <div>
                  <h4 className="font-semibold mb-2">Initial Message</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
                {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Replies ({selectedTicket.replies.length})</h4>
                      <div className="space-y-3">
                        {selectedTicket.replies
                          .filter(reply => !reply.isInternal)
                          .map((reply) => (
                            <div key={reply.id} className="p-3 rounded-md bg-muted">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{reply.user?.username || 'User'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
                {/* Reopen ticket button - only for ticket owner when resolved */}
                {selectedTicket.status === 'RESOLVED' && 
                 selectedTicket.userId === user?.id && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        This ticket has been resolved. If you need further assistance, you can reopen it.
                      </p>
                      <Button onClick={handleReopenTicket} variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reopen Ticket
                      </Button>
                    </div>
                  </>
                )}
                {/* Add reply section - for moderators when ticket is not resolved/closed */}
                {isModerator && selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="reply">Add Reply (Moderator Only)</Label>
                      <Textarea
                        id="reply"
                        placeholder="Type your reply..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        rows={4}
                        maxLength={5000}
                      />
                      <Button onClick={handleAddReply} disabled={!newReply.trim()}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </>
                )}
                {/* Add reply section - for users when ticket is waiting response */}
                {!isModerator && 
                 (selectedTicket.status === 'WAITING_RESPONSE' || selectedTicket.status === 'IN_PROGRESS') && 
                 selectedTicket.userId === user?.id && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="reply">Add Reply</Label>
                      <Textarea
                        id="reply"
                        placeholder="Type your reply..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        rows={4}
                        maxLength={5000}
                      />
                      <Button onClick={handleAddUserReply} disabled={!newReply.trim()}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupportPage;
