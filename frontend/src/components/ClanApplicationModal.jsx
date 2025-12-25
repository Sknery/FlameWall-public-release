import React, { useState, useEffect } from 'react';


import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from 'lucide-react';

function ClanApplicationModal({ open, onClose, clan, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAnswers({});
    }
  }, [open]);

  const handleChange = (label, value) => {
    setAnswers(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(answers);
    setLoading(false);
  };

  if (!clan) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {}
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Application to {clan.name}</DialogTitle>
                <DialogDescription>
                    Fill out the form to apply. Your answers will be reviewed by the clan management.
                </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {clan.application_template?.map((field, index) => (
                    <div key={index} className="space-y-2">
                        <Label htmlFor={`application-field-${index}`}>{field.label}</Label>
                        {field.type === 'textarea' ? (
                            <Textarea
                                id={`application-field-${index}`}
                                value={answers[field.label] || ''}
                                onChange={(e) => handleChange(field.label, e.target.value)}
                                required
                            />
                        ) : (
                            <Input
                                id={`application-field-${index}`}
                                value={answers[field.label] || ''}
                                onChange={(e) => handleChange(field.label, e.target.value)}
                                required
                            />
                        )}
                    </div>
                ))}
            </div>
            <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ClanApplicationModal;
