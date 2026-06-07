import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { JamilaAssistant } from "./JamilaAssistant";

type JamilaFloatingButtonProps = {
  audience: "general" | "erp";
};

export function JamilaFloatingButton({ audience }: JamilaFloatingButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-xl btn-struta-gold p-0"
        aria-label="Open Jamila AI"
      >
        <Sparkles className="w-6 h-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-[var(--surface)] text-[var(--ink)]">
          <DialogHeader>
            <DialogTitle>Jamila AI</DialogTitle>
            <DialogDescription>
              Ask Jamila quick questions about planning, support, reports, and next steps.
            </DialogDescription>
          </DialogHeader>
          <JamilaAssistant audience={audience} />
        </DialogContent>
      </Dialog>
    </>
  );
}
