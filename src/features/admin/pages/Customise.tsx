"use client";

import { useEffect, useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError, showSuccess } from "@/utils/toast";
import { HelpCircle, Megaphone, Plus, RefreshCw, Save, Trash2 } from "lucide-react";

type Article = { id?: string; title: string; slug: string; category: string; content: string; published: boolean; order_index: number; };
type UpdatePopup = { id?: string; title: string; body: string; image_url: string; cta_label: string; cta_url: string; audience: string; active: boolean; starts_at: string; ends_at: string; };

const emptyArticle: Article = { title: "", slug: "", category: "General", content: "", published: true, order_index: 100 };
const emptyUpdate: UpdatePopup = { title: "", body: "", image_url: "", cta_label: "", cta_url: "", audience: "all", active: true, starts_at: "", ends_at: "" };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const toInputDate = (value?: string | null) => { if (!value) return ""; try { return new Date(value).toISOString().slice(0, 16); } catch { return ""; } };
const fromInputDate = (value?: string) => value ? new Date(value).toISOString() : null;

export default function AdminCustomisePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [updates, setUpdates] = useState<UpdatePopup[]>([]);
  const [articleForm, setArticleForm] = useState<Article>(emptyArticle);
  const [updateForm, setUpdateForm] = useState<UpdatePopup>(emptyUpdate);
  const [loading, setLoading] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const articlePreview = useMemo(() => articleForm.content.slice(0, 180), [articleForm.content]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [helpRes, updateRes] = await Promise.all([
        supabase.from("help_center_articles").select("*").order("order_index", { ascending: true }),
        supabase.from("site_update_popups").select("*").order("created_at", { ascending: false }),
      ]);
      if (helpRes.error) throw helpRes.error;
      if (updateRes.error) throw updateRes.error;
      setArticles(helpRes.data || []);
      setUpdates((updateRes.data || []).map((item: any) => ({ ...item, starts_at: toInputDate(item.starts_at), ends_at: toInputDate(item.ends_at) })));
    } catch (error: any) {
      showError(error.message || "Could not load customise data. Run the customise SQL first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const saveArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) { showError("Help article title and content are required."); return; }
    setSavingArticle(true);
    try {
      const payload = { ...articleForm, slug: articleForm.slug || slugify(articleForm.title), updated_by: user?.id || null };
      const { error } = articleForm.id ? await supabase.from("help_center_articles").update(payload).eq("id", articleForm.id) : await supabase.from("help_center_articles").insert({ ...payload, created_by: user?.id || null });
      if (error) throw error;
      showSuccess("Help article saved.");
      setArticleForm(emptyArticle);
      await loadData();
    } catch (error: any) { showError(error.message || "Could not save help article."); } finally { setSavingArticle(false); }
  };

  const saveUpdate = async () => {
    if (!updateForm.title.trim() || !updateForm.body.trim()) { showError("Update title and message are required."); return; }
    setSavingUpdate(true);
    try {
      const payload = { ...updateForm, starts_at: fromInputDate(updateForm.starts_at) || new Date().toISOString(), ends_at: fromInputDate(updateForm.ends_at), updated_by: user?.id || null };
      const { error } = updateForm.id ? await supabase.from("site_update_popups").update(payload).eq("id", updateForm.id) : await supabase.from("site_update_popups").insert({ ...payload, created_by: user?.id || null });
      if (error) throw error;
      showSuccess("Site update popup saved.");
      setUpdateForm(emptyUpdate);
      await loadData();
    } catch (error: any) { showError(error.message || "Could not save site update."); } finally { setSavingUpdate(false); }
  };

  const deleteRow = async (table: "help_center_articles" | "site_update_popups", id?: string) => {
    if (!id || !window.confirm("Delete this item?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) showError(error.message); else { showSuccess("Deleted."); await loadData(); }
  };

  return (
    <PortalLayout portalType="admin">
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h1 className="text-3xl font-black text-[var(--ink)]">Customise Struta</h1><p className="text-[var(--muted)]">Edit Help Center content and publish one-time site update popups.</p></div>
          <Button variant="outline" onClick={loadData} disabled={loading}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-[var(--gold)]" /> Help Page Editor</CardTitle><CardDescription>These articles appear on the public Help page and are searchable.</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="space-y-2"><Label>Title</Label><Input value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value, slug: articleForm.slug || slugify(e.target.value) })} /></div><div className="space-y-2"><Label>Slug</Label><Input value={articleForm.slug} onChange={(e) => setArticleForm({ ...articleForm, slug: slugify(e.target.value) })} /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="space-y-2"><Label>Category</Label><Input value={articleForm.category} onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })} /></div><div className="space-y-2"><Label>Order</Label><Input type="number" value={articleForm.order_index} onChange={(e) => setArticleForm({ ...articleForm, order_index: Number(e.target.value || 100) })} /></div></div>
            <div className="space-y-2"><Label>Content</Label><Textarea className="min-h-[170px]" value={articleForm.content} onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm font-bold"><Switch checked={articleForm.published} onCheckedChange={(checked) => setArticleForm({ ...articleForm, published: checked })} /> Published</label>
            {articlePreview && <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Preview: {articlePreview}</div>}
            <Button className="btn-struta-gold" onClick={saveArticle} disabled={savingArticle}><Save className="w-4 h-4 mr-2" />{savingArticle ? "Saving..." : "Save Help Article"}</Button>
          </CardContent></Card>

          <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-[var(--gold)]" /> Site Update Popup</CardTitle><CardDescription>Publish a popup that appears once per user or visitor.</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea className="min-h-[120px]" value={updateForm.body} onChange={(e) => setUpdateForm({ ...updateForm, body: e.target.value })} /></div>
            <div className="space-y-2"><Label>Image URL optional</Label><Input value={updateForm.image_url || ""} onChange={(e) => setUpdateForm({ ...updateForm, image_url: e.target.value })} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="space-y-2"><Label>Button Label</Label><Input value={updateForm.cta_label || ""} onChange={(e) => setUpdateForm({ ...updateForm, cta_label: e.target.value })} /></div><div className="space-y-2"><Label>Button URL</Label><Input value={updateForm.cta_url || ""} onChange={(e) => setUpdateForm({ ...updateForm, cta_url: e.target.value })} /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div className="space-y-2"><Label>Audience</Label><Select value={updateForm.audience} onValueChange={(value) => setUpdateForm({ ...updateForm, audience: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="family">Bereaved</SelectItem><SelectItem value="operations">Home</SelectItem><SelectItem value="marketplace">Vendor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Starts</Label><Input type="datetime-local" value={updateForm.starts_at} onChange={(e) => setUpdateForm({ ...updateForm, starts_at: e.target.value })} /></div><div className="space-y-2"><Label>Ends optional</Label><Input type="datetime-local" value={updateForm.ends_at || ""} onChange={(e) => setUpdateForm({ ...updateForm, ends_at: e.target.value })} /></div></div>
            <label className="flex items-center gap-2 text-sm font-bold"><Switch checked={updateForm.active} onCheckedChange={(checked) => setUpdateForm({ ...updateForm, active: checked })} /> Active</label>
            <Button className="btn-struta-gold" onClick={saveUpdate} disabled={savingUpdate}><Plus className="w-4 h-4 mr-2" />{savingUpdate ? "Saving..." : "Save Site Update"}</Button>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card><CardHeader><CardTitle>Existing Help Articles</CardTitle></CardHeader><CardContent className="space-y-3">{articles.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-bold">{item.title}</p><p className="text-xs text-slate-500">{item.category} · /{item.slug}</p>{!item.published && <Badge variant="outline">Draft</Badge>}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setArticleForm(item)}>Edit</Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteRow("help_center_articles", item.id)}><Trash2 className="w-4 h-4" /></Button></div></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Existing Site Updates</CardTitle></CardHeader><CardContent className="space-y-3">{updates.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-bold">{item.title}</p><p className="text-xs text-slate-500">Audience: {item.audience}</p>{item.active ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setUpdateForm(item)}>Edit</Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteRow("site_update_popups", item.id)}><Trash2 className="w-4 h-4" /></Button></div></div>)}</CardContent></Card>
        </div>
      </div>
    </PortalLayout>
  );
}
