import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HelpCircle, Search, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  published: boolean;
  order_index?: number;
}

const fallbackArticles: HelpArticle[] = [
  { id: "payments-and-invoices", title: "Payments and invoices", slug: "payments-and-invoices", category: "Billing", published: true, content: "Invoices can be paid using the receiving details configured by the funeral home or vendor. Direct mobile payments remain pending until verified." },
  { id: "requests-and-chat", title: "Requests and chat", slug: "requests-and-chat", category: "Planning", published: true, content: "Families send requests from provider pages. Once accepted, requests can include chat, planning details, invoice updates, and notifications." },
  { id: "memorial-pages", title: "Memorial pages", slug: "memorial-pages", category: "Memorials", published: true, content: "Families can create and share digital memorial pages. Public tribute links are optimized to load quickly and can be shared with friends and relatives." },
];

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ");
const looksLikeHtml = (value?: string) => /<\/?[a-z][\s\S]*>/i.test(value || "");

export function HelpCenter() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => { void loadArticles(); }, []);

  const applyArticles = (items: HelpArticle[]) => {
    setArticles(items);
    setCategories([...new Set(items.map((article) => article.category))]);
    setFilteredArticles(items);
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("help_center_articles").select("*").eq("published", true).order("order_index", { ascending: true });
      if (error) throw error;
      applyArticles((data || []) as HelpArticle[]);
    } catch (error) {
      console.warn("Failed to load help center articles, using fallback.", error);
      applyArticles(fallbackArticles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = articles;
    if (selectedCategory) filtered = filtered.filter((article) => article.category === selectedCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((article) => article.title.toLowerCase().includes(query) || stripHtml(article.content || "").toLowerCase().includes(query));
    }
    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4"><HelpCircle className="w-5 h-5" /><h3 className="font-semibold text-[var(--ink)]">Help Center</h3></div>
        <div className="flex gap-2"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search help articles..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" /></div></div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>All</Button>
            {categories.map((category) => <Button key={category} variant={selectedCategory === category ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(category)}>{category}</Button>)}
          </div>
        )}
      </div>

      {filteredArticles.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-[var(--muted)]">No help articles found</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow border-[var(--border)] bg-[var(--surface)]">
              <CardContent className="p-4">
                <button onClick={() => setSelectedArticle(article)} className="w-full text-left flex items-start justify-between gap-4">
                  <div><h4 className="font-semibold text-sm text-[var(--ink)]">{article.title}</h4><p className="text-xs text-[var(--muted)] mt-1">{article.category}</p></div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 text-[var(--muted)] mt-1" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[var(--surface)] text-[var(--ink)]" aria-describedby="help-article-description">
          <DialogHeader><DialogTitle>{selectedArticle?.title}</DialogTitle><DialogDescription id="help-article-description">{selectedArticle?.category ? `Category: ${selectedArticle.category}` : "Help article"}</DialogDescription></DialogHeader>
          <div className="prose prose-sm max-w-none text-[var(--ink)] dark:prose-invert">
            {looksLikeHtml(selectedArticle?.content) ? <div dangerouslySetInnerHTML={{ __html: selectedArticle?.content || "" }} /> : <div className="text-sm whitespace-pre-wrap">{selectedArticle?.content}</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
