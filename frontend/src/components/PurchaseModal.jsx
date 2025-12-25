
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, ShoppingCart } from 'lucide-react';
import { constructImageUrl } from '../utils/url';

function PurchaseModal({ open, onClose, item, onPurchaseSuccess }) {
  const { authToken, user, refreshUser } = useAuth();
  const [targetUsername, setTargetUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setTargetUsername('');
    }
  }, [open]);

  if (!item) return null;

  const canBeGifted = item.item_type === 'COMMAND';

  const handlePurchase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        itemId: item.item_id,
        targetUsername: targetUsername || undefined,
      };
      const response = await axios.post('/api/shop/purchase', payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      await refreshUser();

      toast.success(response.data.message || 'Purchase successful!');
      onPurchaseSuccess();
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred during purchase.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handlePurchase}>
          <DialogHeader>
            <DialogTitle>Confirm Purchase: {item.name}</DialogTitle>
            <DialogDescription>
              You are about to purchase this item. Please confirm the details below.
            </DialogDescription>
          </DialogHeader>

          {error && <Alert variant="destructive" className="my-4"><Terminal className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-md bg-muted">
              {item.item_type !== 'PROFILE_FRAME' && (
                <img src={constructImageUrl(item.image_url)} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xl font-bold">{item.price} coins</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This will be deducted from your current balance of <strong className="text-primary">{user?.balance} coins</strong>.
            </p>

            {canBeGifted && (
              <div className="space-y-2">
                <Label htmlFor="targetUsername">Gift to another player (optional)</Label>
                <Input
                  id="targetUsername"
                  placeholder="Enter Minecraft username"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || user?.balance < item.price}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
              {user?.balance < item.price ? 'Insufficient Funds' : `Confirm Purchase`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PurchaseModal;
