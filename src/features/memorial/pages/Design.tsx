"use client";

import React, { useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wand2, Type, Move, Sparkles, Palette } from "lucide-react";
import { showSuccess } from "@/utils/toast";

type MemorialTemplate = {
  name: string;
  mood: string;
  bg: string;
  card: string;
  accent: string;
  heading: string;
  body: string;
  spacing: string;
  layout: "centered" | "split" | "editorial" | "framed" | "letter";
  format: string;
};

const templates: MemorialTemplate[] = [
  { name: "Elegant Legacy", mood: "classic serif, soft cream", bg: "#f4efe5", card: "#fffaf1", accent: "#c8923a", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "centered", format: "Centered portrait tribute" },
  { name: "Warm Garden", mood: "gentle botanical", bg: "#f1eadb", card: "#fffdf5", accent: "#8c6f3d", heading: "font-serif text-3xl", body: "text-[15px] leading-8", spacing: "p-7", layout: "framed", format: "Floral family note" },
  { name: "Cinematic Tribute", mood: "dramatic dark", bg: "#11100d", card: "#1c1914", accent: "#d5a653", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "split", format: "Film-style memorial" },
  { name: "Minimal Cream", mood: "quiet modern", bg: "#f7f1e7", card: "#fffaf2", accent: "#0c0b08", heading: "font-sans text-3xl", body: "text-sm leading-7", spacing: "p-6", layout: "centered", format: "Minimal obituary page" },
  { name: "Floral Memory", mood: "soft remembrance", bg: "#f8eee9", card: "#fff9f6", accent: "#b96b5f", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "framed", format: "Photo and floral quote" },
  { name: "Sacred Gold", mood: "formal chapel", bg: "#eee2c8", card: "#fff8e6", accent: "#b98522", heading: "font-serif text-4xl", body: "text-[15px] leading-8", spacing: "p-9", layout: "letter", format: "Program-style tribute" },
  { name: "Midnight Grace", mood: "elegant night", bg: "#0c0b08", card: "#17130d", accent: "#c8923a", heading: "font-serif text-5xl", body: "text-base leading-9", spacing: "p-9", layout: "editorial", format: "Large title editorial" },
  { name: "Kanga Tribute", mood: "East African patterned border", bg: "#f2e7d2", card: "#fff9ec", accent: "#b65332", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "framed", format: "Bordered memory cloth" },
  { name: "Coastal Calm", mood: "Swahili coast serenity", bg: "#e9f1ee", card: "#fafffb", accent: "#2f6f68", heading: "font-serif text-4xl", body: "text-[15px] leading-8", spacing: "p-7", layout: "split", format: "Soft coastal memorial" },
  { name: "Family Hearth", mood: "warm home gathering", bg: "#efe1cf", card: "#fff7ec", accent: "#9d6437", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "letter", format: "Family message first" },
  { name: "Modern Chapel", mood: "clean architecture", bg: "#ece7df", card: "#ffffff", accent: "#34312b", heading: "font-sans text-4xl", body: "text-sm leading-7", spacing: "p-7", layout: "split", format: "Modern service details" },
  { name: "River of Peace", mood: "blue tranquil", bg: "#e8eff4", card: "#fbfdff", accent: "#3f6f91", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "centered", format: "Poetic calm layout" },
  { name: "Ancestral Earth", mood: "earth tones", bg: "#e9ddcd", card: "#fff8eb", accent: "#6e4b2e", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "framed", format: "Grounded legacy page" },
  { name: "Quiet Dove", mood: "white and gentle", bg: "#f8f6f1", card: "#ffffff", accent: "#a9a39a", heading: "font-serif text-3xl", body: "text-sm leading-8", spacing: "p-6", layout: "centered", format: "Soft white memorial" },
  { name: "Royal Remembrance", mood: "purple dignity", bg: "#eee8f3", card: "#fffaff", accent: "#6b4a82", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "editorial", format: "Dignified family tribute" },
  { name: "Nairobi Editorial", mood: "urban polished", bg: "#ebe7df", card: "#fffaf0", accent: "#11100d", heading: "font-sans text-5xl", body: "text-[15px] leading-8", spacing: "p-9", layout: "editorial", format: "Bold magazine style" },
  { name: "Soft Rose", mood: "tender floral", bg: "#f5e9e7", card: "#fffafa", accent: "#a85d63", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "letter", format: "Letter to loved one" },
  { name: "Forest Rest", mood: "green natural", bg: "#e8eee4", card: "#fbfff8", accent: "#476343", heading: "font-serif text-4xl", body: "text-[15px] leading-8", spacing: "p-8", layout: "framed", format: "Nature-led remembrance" },
  { name: "Light of Faith", mood: "golden reverence", bg: "#f6edd9", card: "#fffdf6", accent: "#d39b36", heading: "font-serif text-4xl", body: "text-base leading-8", spacing: "p-8", layout: "centered", format: "Faith-friendly tribute" },
  { name: "Celebration of Life", mood: "bright, hopeful", bg: "#f2ead6", card: "#fff9e9", accent: "#d17a2f", heading: "font-sans text-4xl", body: "text-base leading-8", spacing: "p-7", layout: "split", format: "Joyful memory wall" },
];

export default function MemorialDesign() {
  const [notes, setNotes] = useState("Mention their kindness, family love, faith, work ethic, and the way they brought people together.");
  const [draft, setDraft] = useState("Today we gather to honour a life that touched many hearts. Their warmth, courage, and generosity remain with us, not as a memory that fades, but as a light that continues to guide the family and community they loved.");
  const [templateName, setTemplateName] = useState(templates[0].name);
  const template = useMemo(() => templates.find((item) => item.name === templateName) || templates[0], [templateName]);

  const generateDraft = () => {
    const cleanNotes = notes.trim() || "their love, kindness and legacy";
    setDraft(`We celebrate a life marked by ${cleanNotes}. Their story is carried forward through the people they loved, the lessons they shared, and the quiet strength they gave to everyone around them.`);
    showSuccess("Eulogy draft generated. You can edit it before publishing.");
  };

  const previewLayoutClass = template.layout === "split" ? "grid md:grid-cols-[0.8fr_1.2fr] gap-5 items-stretch" : template.layout === "editorial" ? "space-y-7" : template.layout === "letter" ? "max-w-xl mx-auto space-y-5" : "space-y-5";

  return (
    <PortalLayout portalType="family">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Badge className="bg-[var(--gold-bg)] text-[var(--gold)] border-[var(--gold)]/20"><Sparkles className="w-3 h-3 mr-1" />Design Studio</Badge>
          <h1 className="mt-2 text-3xl font-black text-[var(--ink)]">Memorial Design</h1>
          <p className="text-sm text-[var(--muted)]">Choose from 20 fully styled memorial templates with different colours, spacing, typography, layout, and format.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]">
            <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-[var(--gold)]" />AI Eulogy + Text Studio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><label className="text-sm font-bold">Source notes</label><Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button className="btn-struta-gold" onClick={generateDraft}><Wand2 className="w-4 h-4 mr-2" />Generate Eulogy Draft</Button>
              <div className="space-y-2"><label className="text-sm font-bold">Editable eulogy</label><Textarea rows={10} value={draft} onChange={(e) => setDraft(e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]">
            <CardHeader><CardTitle className="flex items-center gap-2"><Type className="w-5 h-5 text-[var(--gold)]" />Template + Placement</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {templates.map((item) => <button key={item.name} onClick={() => setTemplateName(item.name)} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${template.name === item.name ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]" : "bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--gold)]/50"}`}><span className="block">{item.name}</span><span className="mt-1 block text-[10px] font-semibold opacity-75">{item.format}</span></button>)}
              </div>
              <div className="rounded-[2rem] border p-5 min-h-[460px]" style={{ background: template.bg }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><Badge variant="outline" style={{ borderColor: template.accent, color: template.accent }}>{template.name}</Badge><span className="text-xs font-bold flex items-center gap-1" style={{ color: template.accent }}><Move className="w-3 h-3" />{template.layout} · {template.mood}</span></div>
                <div className={previewLayoutClass}>
                  {template.layout === "split" && <div className="rounded-3xl min-h-[260px] flex items-center justify-center text-6xl font-black" style={{ background: template.accent, color: template.bg }}>S</div>}
                  <div className={`rounded-3xl shadow-sm ${template.spacing}`} style={{ background: template.card, border: `1px solid ${template.accent}33` }}>
                    <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: template.accent }}><Palette className="w-3 h-3" />{template.format}</div>
                    <h2 className={`${template.heading} font-black`} style={{ color: template.accent }}>A Tribute of Love</h2>
                    <p className={`mt-4 ${template.body}`} style={{ color: template.name.includes("Midnight") || template.name.includes("Cinematic") ? "#f8ead2" : "#342d24" }}>{draft}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
