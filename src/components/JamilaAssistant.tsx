import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { showError } from "@/utils/toast";

type JamilaAssistantProps = {
  audience: "general" | "erp";
};

const DAILY_LIMIT = 5;

export function JamilaAssistant({ audience }: JamilaAssistantProps) {
  const { profile } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const usageKey = useMemo(() => {
    const identity = profile?.id || localStorage.getItem("struta_help_guest_id") || crypto.randomUUID();
    localStorage.setItem("struta_help_guest_id", identity);
    const date = new Date().toISOString().slice(0, 10);
    return `jamila_usage_${audience}_${identity}_${date}`;
  }, [audience, profile?.id]);

  const remaining = useMemo(() => {
    const used = Number(localStorage.getItem(usageKey) || "0");
    return Math.max(0, DAILY_LIMIT - used);
  }, [usageKey]);

  const askJamila = async () => {
    if (!prompt.trim()) {
      showError("Enter a question for Jamila first.");
      return;
    }
    if (remaining <= 0) {
      showError("Jamila has reached the 5 questions per day limit for this person.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/help/jamila", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), audience }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Jamila could not answer right now.");
      }
      localStorage.setItem(usageKey, String(DAILY_LIMIT - remaining + 1));
      setAnswer(result.answer || "");
    } catch (error: any) {
      const localAnswer = "## Human support\nI don't have that information. Let me connect you to human support.\n\n📧 info@emtra.top\n💬 WhatsApp: +254 787073955X\n\n**Never share your password.**";
      setAnswer(localAnswer);
      console.warn("Jamila API unavailable:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[var(--gold)]/20 bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--gold)]" />
          Jamila AI
        </CardTitle>
        <CardDescription>
          {audience === "erp"
            ? "Planning, reports, and funeral home/vendor operations help."
            : "Support, planning ideas, and provider guidance for families and visitors."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Ask Jamila</Label>
          <Input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={audience === "erp" ? "Summarize today's urgent cases" : "Help me choose the best funeral home near me"}
          />
          <p className="text-xs text-slate-500">{remaining} of {DAILY_LIMIT} questions left today. Jamila answers in 100 words or fewer.</p>
        </div>
        <Button onClick={() => void askJamila()} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Ask Jamila
        </Button>
        {answer ? (
          <div className="rounded-xl border p-4 text-sm text-slate-700 whitespace-pre-wrap">
            {answer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
