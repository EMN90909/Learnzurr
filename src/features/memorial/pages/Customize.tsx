"use client";

import React, { useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Eye, GripVertical, ImagePlus, LayoutTemplate, Save } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const blocks = ["Hero Image", "Life Story", "Gallery", "Programme", "Tributes"];

export default function MemorialCustomize() {
  const [title, setTitle] = useState("A beautiful life remembered");
  const [theme, setTheme] = useState("Warm Cream + Gold");
  const [story, setStory] = useState("Write a warm memorial story here. This Pro builder keeps your design saved even if Pro later expires, but editing is locked until renewal.");
  const [order, setOrder] = useState(blocks);
  const previewOrder = useMemo(() => order.join(" → "), [order]);

  const moveBlock = (index: number, direction: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <PortalLayout portalType="family">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="bg-[var(--gold-bg)] text-[var(--gold)] border-[var(--gold)]/20">Pro Memorial Builder</Badge>
            <h1 className="mt-2 text-3xl font-black text-[var(--ink)]">Customize Memorial</h1>
            <p className="text-sm text-[var(--muted)]">Live preview, layout ordering, hero styling, and protected Pro memorial editing.</p>
          </div>
          <Button className="btn-struta-primary" onClick={() => showSuccess("Memorial customization saved locally. Connect to memorial record when selecting a memorial.")}><Save className="w-4 h-4 mr-2" />Save Design</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2 rounded-3xl border-[var(--border)]">
            <CardHeader><CardTitle className="flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-[var(--gold)]" />Builder Controls</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2"><Label>Memorial heading</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Theme</Label><Input value={theme} onChange={(e) => setTheme(e.target.value)} /></div>
              <div className="space-y-2"><Label>Story intro</Label><Textarea rows={5} value={story} onChange={(e) => setStory(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Drag-style section order</Label>
                <div className="space-y-2">
                  {order.map((block, index) => (
                    <div key={block} className="flex items-center justify-between rounded-2xl border p-3 bg-white dark:bg-[#181612]">
                      <div className="flex items-center gap-2 text-sm font-bold"><GripVertical className="w-4 h-4 text-slate-400" />{block}</div>
                      <div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => moveBlock(index, -1)}>Up</Button><Button variant="outline" size="sm" onClick={() => moveBlock(index, 1)}>Down</Button></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 rounded-3xl border-[var(--border)] overflow-hidden">
            <CardHeader className="flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-[var(--gold)]" />Live Preview</CardTitle><Badge variant="outline">{theme}</Badge></CardHeader>
            <CardContent>
              <div className="rounded-[2rem] border bg-[#f4efe5] p-6 shadow-inner min-h-[620px]">
                <div className="rounded-[1.5rem] bg-white/80 border p-5 text-center">
                  <div className="mx-auto mb-4 flex h-48 items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[var(--gold)]/40 bg-[var(--cream)] text-[var(--gold)]"><ImagePlus className="w-10 h-10" /></div>
                  <h2 className="font-head text-4xl font-black text-[#0c0b08]">{title}</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">{story}</p>
                  <div className="mt-6 rounded-2xl bg-[var(--gold-bg)] p-3 text-xs font-bold text-[var(--gold)]">{previewOrder}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
