import { HelpCenter } from "@/components/HelpCenter";
import { StrutaLogo } from "@/components/StrutaLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Help = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {(profile || user) && (
            <Avatar className="h-10 w-10 border border-[var(--border)]">
              <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <StrutaLogo size="big" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[var(--ink)]">Help Center</h1>
            <p className="text-[var(--muted)] mt-2">
              Search guides, solve common issues, and get support without signing in.
            </p>
          </div>
        </div>

        <HelpCenter />
      </div>
    </div>
  );
};

export default Help;
