import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Flag } from 'lucide-react';

const REPORT_REASONS = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  COPYRIGHT_VIOLATION: 'Copyright Violation',
  FAKE_INFORMATION: 'Fake Information',
  OTHER: 'Other',
};

const REPORT_TYPES = {
  POST: 'POST',
  COMMENT: 'COMMENT',
  NEWS: 'NEWS',
  USER: 'USER',
  CLAN: 'CLAN',
};

function ReportModal({ open, onClose, type, targetId, targetName, entityData }) {
  const { authToken } = useAuth();
  const [reason, setReason] = useState('SPAM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      
      // Create subject and message for the ticket
      const subject = `Report: ${REPORT_TYPES[type] || type} #${targetId} - ${REPORT_REASONS[reason]}`;
      const message = `Report Reason: ${REPORT_REASONS[reason]}\n\n${description.trim() || 'No additional details provided.'}`;
      
      // Prepare entity data as JSON string
      const reportEntityData = entityData ? JSON.stringify(entityData) : undefined;
      
      await axios.post(
        '/api/support/tickets',
        {
          subject,
          message,
          category: 'OTHER',
          priority: 'HIGH',
          reportEntityType: REPORT_TYPES[type] || type,
          reportEntityId: targetId,
          reportEntityData,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      toast.success('Report submitted successfully. A support ticket has been created for moderation.');
      setReason('SPAM');
      setDescription('');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeLabel = () => {
    return REPORT_TYPES[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report {getReportTypeLabel()}
            </DialogTitle>
            <DialogDescription>
              {targetName && (
                <span>Reporting: <strong>{targetName}</strong></span>
              )}
              <br />
              Please select a reason and provide additional details if needed. Our moderation team will review your report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Report</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_REASONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Additional Details (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide any additional context that might help our moderation team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ReportModal;

