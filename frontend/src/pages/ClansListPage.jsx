import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Search, Plus } from 'lucide-react';


import ClanCard from '../components/ClanCard';
import { listContainer, fadeInUp } from '../utils/animations';

function ClansListPage() {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn, user } = useAuth();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const canCreateClan = isLoggedIn && user && !user.clanMembership;
  const { setBreadcrumbs } = useBreadcrumbs();
  const observer = useRef();

  const lastClanElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchClans = useCallback(async (isSearchChange) => {
    setLoading(true);
    setError(null);
    const currentPage = isSearchChange ? 1 : page;
    try {
      const response = await axios.get('/api/clans', {
        params: { page: currentPage, limit: 12, search: searchQuery },
      });
      setClans(prev => isSearchChange ? response.data.data : [...prev, ...response.data.data]);
      setHasMore(response.data.data.length > 0);
    } catch (err) {
      setError('Failed to load clans.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Community', link: '/clans' },
      { label: 'Clans' }
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchClans(true);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (page > 1) {
      fetchClans(false);
    }
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="font-sans text-3xl font-bold">Clans Directory</h1>
        {canCreateClan && (
          <Button asChild>
            <RouterLink to="/clans/new"><Plus className="mr-2 h-4 w-4" />Create a Clan</RouterLink>
          </Button>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="w-full md:w-1/3 pl-8"
          placeholder="Search by name or @tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <motion.div variants={listContainer} initial="initial" animate="animate" className="responsive-grid">
        {clans.map((clan, index) => {
          if (clans.length === index + 1) {
            return (
              <motion.div ref={lastClanElementRef} key={clan.id} variants={fadeInUp}>
                <ClanCard clan={clan} />
              </motion.div>
            );
          }
          return (
            <motion.div key={clan.id} variants={fadeInUp} className="w-full max-w-[320px]">
              <ClanCard clan={clan} />
            </motion.div>
          );
        })}
      </motion.div>

      {loading && <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>}

      {!loading && !hasMore && clans.length > 0 && <p className="text-center text-muted-foreground text-sm py-4">You've reached the end of the list.</p>}

      {!loading && clans.length === 0 && hasMore === false && <p className="text-muted-foreground text-center py-8">No clans found for your search.</p>}

    </div>
  );
}

export default ClansListPage;
