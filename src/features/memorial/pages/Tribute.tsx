"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, Check, Heart, MapPin, MessageSquare, Share2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { showError, showSuccess } from "@/utils/toast";
import { deserializeThemeStyle } from "@/features/bereaved/components/EditMemorialDialog";
import DominoLoader from "@/components/DominoLoader";
import { MadeWithDyad } from "@/components/made-with-dyad";

type MemorialPage = {
  id: string;
  user_id: string | null;
  deceased_name: string | null;
  title: string | null;
  biography: string | null;
  public_slug: string | null;
  slug: string | null;
  birth_date: string | null;
  death_date: string | null;
  photo_url: string | null;
  cover_image_url: string | null;
  gallery: string[] | null;
  theme_style: string | null;
  ceremony_date: string | null;
  ceremony_time: string | null;
  ceremony_location: string | null;
  family_message: string | null;
  status: string | null;
  is_public: boolean | null;
  whatsapp_group_link?: string | null;
};

type Comment = {
  id: string;
  memorial_id: string;
  user_id: string | null;
  author_name: string;
  relationship: string | null;
  message: string;
  approved: boolean | null;
  created_at: string;
};

const MEMORIAL_COLUMNS = "id,user_id,deceased_name,title,biography,public_slug,slug,birth_date,death_date,photo_url,cover_image_url,gallery,theme_style,ceremony_date,ceremony_time,ceremony_location,family_message,status,is_public";

const isUuid = (value?: string) => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const safeDate = (value?: string | null) => {
  if (!value) return "";
  try { return format(new Date(value), "MMMM d, yyyy"); } catch { return ""; }
};

const themeStyles: Record<string, { bg: string; card: string; text: string; accent: string; border: string }> = {
  cream: { bg: "bg-[var(--paper)]", card: "bg-[var(--surface)] border-[var(--border)]", text: "text-[var(--ink)]", accent: "text-[var(--gold)] bg-[var(--gold-bg)] border-[var(--gold)]/20", border: "border-[var(--border)]" },
  gold: { bg: "bg-[#faf6ee]", card: "bg-white border-[#e6dcbc]", text: "text-[#3d3011]", accent: "text-[#c8923a] bg-[#fcf8eb] border-[#e6dcbc]", border: "border-[#e6dcbc]" },
  dark: { bg: "bg-[#11100d]", card: "bg-[#1c1a16] border-[#39342c]", text: "text-[#f6efe4]", accent: "text-[#e0aa4f] bg-[rgba(224,170,79,0.14)] border-[#39342c]", border: "border-[#39342c]" },
  forest: { bg: "bg-[#f2f5f3]", card: "bg-white border-[#d1ded4]", text: "text-[#1a3020]", accent: "text-[#2d6a4f] bg-[#edf7f2] border-[#d1ded4]", border: "border-[#d1ded4]" },
};

export default function TributePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [memorial, setMemorial] = useState<MemorialPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ author_name: "", relationship: "Friend", message: "" });
  const [submittingComment, setSubmittingComment] = useState(false);

  const currentTheme = useMemo(() => {
    const theme = memorial?.theme_style ? deserializeThemeStyle(memorial.theme_style).theme : "cream";
    return themeStyles[theme] || themeStyles.cream;
  }, [memorial?.theme_style]);

  useEffect(() => {
    let cancelled = false;
    const fetchMemorialData = async () => {
      if (!slug) { setLoading(false); return; }
      setLoading(true);
      try {
        let query = supabase.from("memorial_pages").select(MEMORIAL_COLUMNS);
        query = isUuid(slug) ? query.or(`public_slug.eq.${slug},slug.eq.${slug},id.eq.${slug}`) : query.or(`public_slug.eq.${slug},slug.eq.${slug}`);
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (!data) { if (!cancelled) setMemorial(null); return; }

        const { extra } = deserializeThemeStyle(data.theme_style);
        const enrichedMemorial = { ...data, whatsapp_group_link: (extra as any)?.whatsapp_group_link || (data as any).whatsapp_group_link } as MemorialPage;
        if (!cancelled) setMemorial(enrichedMemorial);

        supabase
          .from("memorial_comments")
          .select("id,memorial_id,user_id,author_name,relationship,message,approved,created_at")
          .eq("memorial_id", data.id)
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(25)
          .then(({ data: commentsData }) => { if (!cancelled) setComments((commentsData || []) as Comment[]); });
      } catch (err: any) {
        console.error("Error fetching memorial:", err);
        showError(err.message || "Could not load tribute page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchMemorialData();
    return () => { cancelled = true; };
  }, [slug]);

  const handleShare = async () => {
    const pageSlug = memorial?.public_slug || memorial?.slug || memorial?.id || slug;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/memorial/${pageSlug}`);
      setCopied(true);
      showSuccess("Tribute link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch { showError("Could not copy link."); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memorial?.id) return;
    if (!newComment.author_name.trim() || !newComment.message.trim()) { showError("Please fill in your name and message."); return; }
    setSubmittingComment(true);
    try {
      const payload = { memorial_id: memorial.id, user_id: user?.id || null, author_name: newComment.author_name.trim(), relationship: newComment.relationship, message: newComment.message.trim(), approved: true };
      const { data, error } = await supabase.from("memorial_comments").insert(payload).select("*").single();
      if (error) throw error;
      setComments((prev) => [data as Comment, ...prev]);
      setNewComment({ author_name: "", relationship: "Friend", message: "" });
      showSuccess("Tribute message added successfully.");
    } catch (err: any) { showError(err.message || "Could not add tribute message."); } finally { setSubmittingComment(false); }
  };

  if (loading) return <DominoLoader message="Loading tribute page..." fullscreen />;
  if (!memorial) return <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--paper)] p-8 text-center"><h1 className="text-4xl font-bold mb-4">Memorial Not Found</h1><p className="text-[var(--muted)] mb-8">The tribute page you are looking for does not exist.</p><Button asChild className="btn-struta-gold"><Link to="/">Return Home</Link></Button></div>;

  const heroImage = memorial.cover_image_url || memorial.photo_url;
  const profileImage = memorial.photo_url;

  return (
    <div className={`min-h-screen ${currentTheme.bg} transition-colors duration-300 pb-20`}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="font-head text-xl font-black text-[var(--ink)]">Struta<em className="not-italic text-[var(--gold)]">.</em></Link>
        <Button variant="outline" size="sm" onClick={handleShare} className="font-bold">{copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Share2 className="w-4 h-4 mr-2" />}Share Link</Button>
      </nav>

      <div className="relative h-[380px] bg-slate-900 overflow-hidden">
        {heroImage ? <img src={heroImage} className="w-full h-full object-cover opacity-50 blur-[2px]" alt="Memorial background" loading="eager" decoding="async" fetchPriority="high" /> : <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-black opacity-90" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12"><div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left"><div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white shrink-0">{profileImage ? <img src={profileImage} className="w-full h-full object-cover" alt={memorial.deceased_name || "Memorial portrait"} loading="eager" decoding="async" /> : <div className="w-full h-full flex items-center justify-center bg-[var(--cream)] text-[var(--gold)]"><User className="w-16 h-16" /></div>}</div><div className="flex-1 text-white pb-2"><span className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">In Loving Memory</span><h1 className="font-head text-3xl md:text-5xl font-black mt-3 mb-2">{memorial.deceased_name || "Loved One"}</h1><p className="text-lg text-slate-300 font-medium italic">{safeDate(memorial.birth_date) || "..."} — {safeDate(memorial.death_date) || "..."}</p></div></div></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className={`${currentTheme.card} shadow-sm`}><CardContent className="p-8 space-y-4"><h2 className={`font-head text-2xl font-bold ${currentTheme.text}`}>The Life Story</h2><div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">{memorial.biography || "No obituary has been shared yet. The family will update this section soon."}</div></CardContent></Card>
          <Tabs defaultValue="tributes" className="w-full"><TabsList className="w-full justify-start bg-transparent border-b border-slate-200 rounded-none h-auto p-0 gap-8"><TabsTrigger value="tributes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm">Tribute Messages ({comments.length})</TabsTrigger><TabsTrigger value="gallery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm">Memory Gallery ({memorial.gallery?.length || 0})</TabsTrigger></TabsList>
            <TabsContent value="tributes" className="pt-6 space-y-6"><Card className={`${currentTheme.card} shadow-sm`}><CardHeader><CardTitle className="font-head text-xl">Leave a Tribute Message</CardTitle><CardDescription>Share a memory, condolence, or word of comfort for the family.</CardDescription></CardHeader><CardContent><form onSubmit={handleAddComment} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Your Name</Label><Input required value={newComment.author_name} onChange={(e) => setNewComment({ ...newComment, author_name: e.target.value })} /></div><div className="space-y-2"><Label>Relationship</Label><Select value={newComment.relationship} onValueChange={(value) => setNewComment({ ...newComment, relationship: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Family">Family Member</SelectItem><SelectItem value="Friend">Friend</SelectItem><SelectItem value="Colleague">Colleague</SelectItem><SelectItem value="Neighbor">Neighbor</SelectItem><SelectItem value="Well-wisher">Well-wisher</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label>Your Message</Label><Textarea required className="min-h-[100px]" value={newComment.message} onChange={(e) => setNewComment({ ...newComment, message: e.target.value })} /></div><Button type="submit" className="btn-struta-gold w-full" disabled={submittingComment}><Heart className="w-4 h-4 mr-2 fill-current" />{submittingComment ? "Publishing..." : "Publish Tribute"}</Button></form></CardContent></Card>{comments.map((comment) => <Card key={comment.id} className={`${currentTheme.card} shadow-sm`}><CardContent className="p-6"><div className="flex justify-between items-start gap-4 mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[var(--gold-bg)] flex items-center justify-center text-[var(--gold)] shrink-0"><User className="w-5 h-5" /></div><div><h4 className={`font-bold ${currentTheme.text}`}>{comment.author_name}</h4><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold-bg)] text-[var(--gold)] border border-[var(--gold)]/10">{comment.relationship || "Friend"}</span></div></div><span className="text-xs text-[var(--muted)]">{safeDate(comment.created_at)}</span></div><p className="text-sm text-slate-600 leading-relaxed">“{comment.message}”</p></CardContent></Card>)}{comments.length === 0 && <div className="text-center py-12 text-[var(--muted)] italic">No tribute messages left yet. Be the first to share a memory.</div>}</TabsContent>
            <TabsContent value="gallery" className="pt-6"><Card className={`${currentTheme.card} shadow-sm`}><CardContent className="p-6"><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{memorial.gallery?.slice(0, 24).map((photo, index) => <div key={photo} className="aspect-square rounded-xl overflow-hidden border bg-slate-50 shadow-sm"><img src={photo} className="w-full h-full object-cover" alt={`Memory ${index + 1}`} loading="lazy" decoding="async" /></div>)}{(!memorial.gallery || memorial.gallery.length === 0) && <div className="col-span-full text-center py-12 text-[var(--muted)] italic">No photos have been added to the gallery yet.</div>}</div></CardContent></Card></TabsContent>
          </Tabs>
        </div>
        <div className="space-y-6">{memorial.whatsapp_group_link && <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm"><CardContent className="p-6 space-y-3"><h3 className="font-head text-lg font-bold text-emerald-800 flex items-center gap-2"><MessageSquare className="w-5 h-5" />Family WhatsApp Group</h3><p className="text-xs text-emerald-700 leading-relaxed">Join the family group for funeral arrangement updates.</p><Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" asChild><a href={memorial.whatsapp_group_link} target="_blank" rel="noopener noreferrer">Join WhatsApp Group</a></Button></CardContent></Card>}{(memorial.ceremony_date || memorial.ceremony_time || memorial.ceremony_location) && <Card className="bg-[var(--ink)] text-[var(--paper)] border-none shadow-lg"><CardContent className="p-6 space-y-6"><h3 className="font-head text-xl font-bold flex items-center gap-2 text-[var(--gold)]"><Calendar className="w-5 h-5" />Service Details</h3>{memorial.ceremony_date && <div className="border-l-2 border-[var(--gold)] pl-4 py-1"><p className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider mb-1">Funeral Service</p><p className="font-bold text-lg">{safeDate(memorial.ceremony_date)}</p>{memorial.ceremony_time && <p className="text-sm text-slate-300 mt-1">{memorial.ceremony_time}</p>}</div>}{memorial.ceremony_location && <div className="flex items-start gap-2 text-sm text-slate-300"><MapPin className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" /><span>{memorial.ceremony_location}</span></div>}</CardContent></Card>}<Card className={`${currentTheme.card} shadow-sm`}><CardContent className="p-6 space-y-4"><h3 className={`font-head text-lg font-bold ${currentTheme.text}`}>Family Gratitude</h3><p className="text-sm text-slate-600 leading-relaxed">{memorial.family_message || `The family of ${memorial.deceased_name || "our loved one"} wishes to express their heartfelt gratitude for the prayers, presence, and support.`}</p></CardContent></Card><MadeWithDyad /></div>
      </div>
    </div>
  );
}
