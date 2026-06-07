"use client";

import React from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { BellRing, CheckCircle2, Clock, FileText, MessageSquare, Sparkles, Users } from "lucide-react";

const PriorityMatching = () => {
  const location = useLocation();
  const isVendor = location.pathname.startsWith("/marketplace");
  const portalType = isVendor ? "marketplace" : "operations";
  const requestPath = isVendor ? "/marketplace/orders" : "/operations/requests";
  const chatPath = isVendor ? "/marketplace/chats" : "/operations/chats";

  const matchingRules = [
    "Show urgent family requests first",
    "Prioritise providers whose services match the family request",
    "Surface requests from nearby locations before distant ones",
    "Highlight families waiting longest for a reply",
    "Keep active conversations visible until resolved",
  ];

  return (
    <PortalLayout portalType={portalType as "operations" | "marketplace"}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <Badge className="bg-[var(--gold-bg)] text-[var(--gold)] border-[var(--gold)]/20"><Sparkles className="w-3 h-3 mr-1" />Priority Matching</Badge>
            <h1 className="mt-3 text-4xl font-black text-[var(--ink)]">Priority Matching Queue</h1>
            <p className="mt-2 text-[var(--muted)] max-w-2xl font-semibold">A focused queue for high-intent family requests, urgent bookings, and conversations that need a faster response.</p>
          </div>
          <div className="flex gap-3"><Button asChild className="btn-struta-gold"><Link to={requestPath}>View Requests</Link></Button><Button asChild variant="outline"><Link to={chatPath}>Open Chats</Link></Button></div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]"><CardHeader><CardTitle className="flex gap-2 items-center"><BellRing className="w-5 h-5 text-[var(--gold)]" />Urgent</CardTitle></CardHeader><CardContent><p className="text-4xl font-black">0</p><p className="text-sm text-[var(--muted)]">Requests marked urgent or time-sensitive.</p></CardContent></Card>
          <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]"><CardHeader><CardTitle className="flex gap-2 items-center"><Clock className="w-5 h-5 text-[var(--gold)]" />Waiting</CardTitle></CardHeader><CardContent><p className="text-4xl font-black">0</p><p className="text-sm text-[var(--muted)]">Families waiting for provider action.</p></CardContent></Card>
          <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]"><CardHeader><CardTitle className="flex gap-2 items-center"><Users className="w-5 h-5 text-[var(--gold)]" />Matched</CardTitle></CardHeader><CardContent><p className="text-4xl font-black">Ready</p><p className="text-sm text-[var(--muted)]">Matching uses your services, location and availability.</p></CardContent></Card>
        </div>

        <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--gold)]" />How matching works</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {matchingRules.map((rule) => <div key={rule} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4"><CheckCircle2 className="w-5 h-5 text-[var(--gold)] mt-0.5" /><p className="font-bold text-sm text-[var(--ink)]">{rule}</p></div>)}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)]">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div><h2 className="text-xl font-black">Respond faster from one place</h2><p className="text-sm text-[var(--muted)]">Use requests and chats together to convert high-priority matches into confirmed bookings.</p></div>
            <Button asChild className="btn-struta-primary"><Link to={chatPath}><MessageSquare className="w-4 h-4 mr-2" />Continue Conversations</Link></Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default PriorityMatching;
