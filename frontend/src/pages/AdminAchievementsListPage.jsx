
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Plus, LayoutList } from 'lucide-react';


import AchievementTree from '../components/AchievementTree';

function AdminAchievementsListPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authToken } = useAuth();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/achievements/admin', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setAchievements(response.data);
    } catch (err) {
      setError('Failed to load achievements list.');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    setBreadcrumbs([ { label: 'Admin Panel' }, { label: 'Achievement Tree' } ]);
    fetchAchievements();
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, fetchAchievements]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
            <h1 className="font-sans text-3xl font-bold">Achievement Editor</h1>
            <p className="text-sm text-muted-foreground">Build the progression tree for your players.</p>
        </div>
        <div className="flex gap-2">
            {}
            <Button onClick={() => navigate('/admin/achievements/new')}>
              <Plus className="mr-2 h-4 w-4" /> New Root
            </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-xl overflow-hidden shadow-sm bg-black">
        <AchievementTree
            achievements={achievements}
            onNodeSelect={(ach) => navigate(`/admin/achievements/edit/${ach.id}`)}
            onAddNode={(parentId) => navigate(`/admin/achievements/new?parentId=${parentId}`)}
            isEditorMode={true}        />
      </div>
    </div>
  );
}

export default AdminAchievementsListPage;