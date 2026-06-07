"use client";

import React, { useEffect, useState, useRef } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Plus, ExternalLink, Settings, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';
import EditMemorialDialog from '../components/EditMemorialDialog';
import { Badge } from '@/components/ui/badge';
import DominoLoader from '@/components/DominoLoader';

const ITEMS_PER_PAGE = 6;
const PUBLIC_DOMAIN = "struta.top";
const cacheKeyFor = (userId: string) => `struta_memorials_cache_${userId}`;
const readCache = (userId: string) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKeyFor(userId)) || "{}");
    if (Array.isArray(parsed.items)) return parsed.items;
  } catch {}
  return [];
};
const writeCache = (userId: string, items: any[]) => {
  try { localStorage.setItem(cacheKeyFor(userId), JSON.stringify({ cached_at: new Date().toISOString(), items })); } catch {}
};
const publicLink = (slug?: string) => `${PUBLIC_DOMAIN}/memorial/${slug || "memorial"}`;
const statusLabel = (status?: string) => {
  const value = String(status || "").toLowerCase();
  if (value === "hosted") return "Hosted";
  if (value === "published") return "Published";
  return "";
};

const FamilyMemorials = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [pageTitle, setPageTitle] = useState("My Memorials");
  const [selectedMemorial, setSelectedMemorial] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const updateQueue = useRef<any[]>([]);
  const isProcessingQueue = useRef(false);

  const commitMemorials = (next: any[]) => {
    setMemorials(next);
    if (user?.id) writeCache(user.id, next);
  };

  const processQueue = () => {
    if (isProcessingQueue.current || updateQueue.current.length === 0) return;
    isProcessingQueue.current = true;
    const nextUpdate = updateQueue.current.shift();
    const { eventType, new: newRecord, old: oldRecord } = nextUpdate;
    setMemorials((prev) => {
      let next = prev;
      if (eventType === 'INSERT') next = prev.some(m => m.id === newRecord.id) ? prev : [newRecord, ...prev];
      if (eventType === 'UPDATE') next = prev.map(m => m.id === newRecord.id ? { ...m, ...newRecord } : m);
      if (eventType === 'DELETE') next = prev.filter(m => m.id !== oldRecord.id);
      if (user?.id) writeCache(user.id, next);
      return next;
    });
    isProcessingQueue.current = false;
    setTimeout(processQueue, 100);
  };

  const fetchMemorials = async (pageNum: number, append = false) => {
    if (!user?.id) return;
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const { data, error } = await supabase.from('memorial_pages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;
      const rows = data || [];
      if (append) {
        setMemorials(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const next = [...prev, ...rows.filter(m => !existingIds.has(m.id))];
          writeCache(user.id, next);
          return next;
        });
      } else {
        commitMemorials(rows);
      }
      setHasMore(rows.length === ITEMS_PER_PAGE);
    } catch (err: any) {
      const cached = readCache(user.id);
      if (cached.length) {
        setMemorials(cached);
        setHasMore(false);
        showError("Could not refresh memorials, showing cached memorials.");
      } else {
        showError(err.message || "Failed to load memorials.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const cached = readCache(user.id);
      if (cached.length) {
        setMemorials(cached);
        setLoading(false);
      }
      fetchMemorials(0, false);
      setPage(0);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('realtime-memorials').on('postgres_changes', { event: '*', schema: 'public', table: 'memorial_pages', filter: `user_id=eq.${user.id}` }, (payload) => { updateQueue.current.push(payload); processQueue(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleLoadMore = () => { const nextPage = page + 1; setPage(nextPage); fetchMemorials(nextPage, true); };
  const handleOpenEdit = (m: any) => { setSelectedMemorial(m); setIsEditDialogOpen(true); };
  const handleMemorialUpdated = (updated: any) => {
    if (!updated) {
      if (selectedMemorial) commitMemorials(memorials.filter(m => m.id !== selectedMemorial.id));
      setSelectedMemorial(null);
      setIsEditDialogOpen(false);
      showSuccess("Memorial deleted successfully!");
      return;
    }
    commitMemorials(memorials.map(m => m.id === updated.id ? updated : m));
    showSuccess("Memorial updated successfully!");
  };
  const handleIconClick = () => {
    const newTitle = pageTitle === "My Memorials" ? "Our Sacred Tributes" : "My Memorials";
    setPageTitle(newTitle);
    showSuccess(`Display mode changed to: ${newTitle}`);
  };

  return (
    <PortalLayout portalType="family">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={handleIconClick} className="w-10 h-10 rounded-xl bg-[var(--gold-bg)] flex items-center justify-center text-[var(--gold)] hover:scale-110 transition-transform duration-200" title="Click to change display name"><Heart className="w-5 h-5 fill-current" /></button>
            <div><h2 className="text-3xl font-bold text-[var(--ink)] transition-all duration-300">{pageTitle}</h2></div>
          </div>
          <Button className="btn-struta-gold" asChild><Link to="/family/memorials/create"><Plus className="w-4 h-4 mr-2" />Create New</Link></Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><DominoLoader message="Loading memorials..." /></div>
        ) : memorials.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memorials.map((m) => {
                const label = statusLabel(m.status);
                return (
                  <Card key={m.id} className="card-struta p-0 overflow-hidden group">
                    <div className="h-32 bg-[var(--cream)] relative flex items-center justify-center overflow-hidden">
                      {m.photo_url ? <img src={m.photo_url} className="w-full h-full object-cover opacity-90" alt={m.title} /> : <div className="flex flex-col items-center text-[var(--muted)]"><Globe className="w-8 h-8 mb-1 opacity-40" /><span className="text-xs">No photo uploaded</span></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {label && <div className="absolute top-3 left-3"><Badge className="capitalize font-bold text-[10px] px-2 py-0.5 rounded-full border-none bg-emerald-600 text-white">{label}</Badge></div>}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-[var(--ink)] mb-1 truncate">{m.title}</h3>
                      <p className="text-xs text-[var(--muted)] mb-6 truncate">{publicLink(m.public_slug)}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild><Link to={`/memorial/${m.public_slug}`}><ExternalLink className="w-3 h-3 mr-2" />View</Link></Button>
                        <Button variant="ghost" size="sm" className="flex-1 hover:bg-[var(--gold-bg)] hover:text-[var(--gold)]" onClick={() => handleOpenEdit(m)}><Settings className="w-3 h-3 mr-2" />Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {hasMore && <div className="flex justify-center pt-4"><Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="min-w-[150px]">{loadingMore ? <span className="loader-inline"><span className="custom-loader" /></span> : "Load More"}</Button></div>}
          </div>
        ) : (
          <div className="col-span-full text-center py-20 bg-[var(--surface)] rounded-2xl border-2 border-dashed border-[var(--border)]">
            <Globe className="w-12 h-12 text-[var(--gold)] mx-auto mb-4 opacity-20" />
            <p className="text-[var(--muted)] mb-6">You haven't created any digital memorials yet.</p>
            <Button className="btn-struta-gold" asChild><Link to="/family/memorials/create">Create Your First Memorial</Link></Button>
          </div>
        )}
      </div>
      {selectedMemorial && <EditMemorialDialog memorial={selectedMemorial} isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} onUpdate={handleMemorialUpdated} />}
    </PortalLayout>
  );
};

export default FamilyMemorials;
