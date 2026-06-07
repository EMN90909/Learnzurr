"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

const InvitationClaim = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [caseDetails, setCaseDetails] = useState<any>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const { data: invite, error: inviteError } = await supabase
          .from("case_invitations")
          .select("*")
          .eq("token", token)
          .maybeSingle();

        if (inviteError) throw inviteError;
        if (!invite) {
          setLoading(false);
          return;
        }

        if (invite.status !== "Pending" || new Date(invite.expires_at) < new Date()) {
          setInvitation({ ...invite, isExpired: true });
          setLoading(false);
          return;
        }

        setInvitation(invite);

        // Fetch Case details (memorial request)
        const { data: caseData, error: caseError } = await supabase
          .from("memorial_requests")
          .select("id, deceased_name, user_profiles(full_name)")
          .eq("id", invite.case_id)
          .maybeSingle();

        if (caseError) console.error("Error fetching case details:", caseError);
        setCaseDetails(caseData);
      } catch (err: any) {
        console.error("Error claim fetch:", err);
        showError(err.message || "Failed to load invitation.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!user || !invitation) return;
    setClaiming(true);
    try {
      // 1. Insert into case_members
      const { error: memberError } = await supabase
        .from("case_members")
        .insert({
          case_id: invitation.case_id,
          user_id: user.id,
          email: user.email,
          name: invitation.invited_name,
          relationship: invitation.relationship,
          role: invitation.role,
          permissions: invitation.permissions
        });

      if (memberError) throw memberError;

      // 2. Mark invitation as Accepted
      const { error: inviteError } = await supabase
        .from("case_invitations")
        .update({ status: "Accepted" })
        .eq("id", invitation.id);

      if (inviteError) throw inviteError;

      showSuccess("You have joined the coordination group!");
      navigate("/family", { replace: true });
    } catch (err: any) {
      showError(err.message || "Failed to accept invitation.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--paper)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)] mb-4" />
        <p className="text-[var(--muted)] font-bold">Verifying invitation...</p>
      </div>
    );
  }

  if (!invitation || invitation.isExpired) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl p-8 border border-[var(--border)] text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">Invitation Invalid</h1>
          <p className="text-[var(--muted)] mb-8">
            This invitation link is invalid, expired, or has already been accepted/revoked. Ask the coordinator to send a new link.
          </p>
          <Button asChild className="w-full btn-struta-primary h-12">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const inviterName = caseDetails?.user_profiles?.full_name || "a family representative";

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl p-8 border border-[var(--border)]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[var(--gold-bg)] rounded-xl flex items-center justify-center mb-4 text-[var(--gold)]">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-[var(--ink)]">Join Coordination Group</h1>
          <p className="text-[var(--muted)] text-center mt-2">
            You've been invited to help coordinate the funeral services.
          </p>
        </div>

        <div className="bg-[var(--cream)] rounded-xl p-5 border border-[var(--border)] mb-8 space-y-3">
          <div className="text-sm">
            <span className="text-[var(--muted)] block">Invited by:</span>
            <span className="font-bold text-[var(--ink)]">{inviterName}</span>
          </div>
          <div className="text-sm">
            <span className="text-[var(--muted)] block">For deceased:</span>
            <span className="font-bold text-[var(--ink)]">{caseDetails?.deceased_name || "Loved One"}</span>
          </div>
          <div className="text-sm">
            <span className="text-[var(--muted)] block">Your role will be:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--gold-bg)] text-[var(--gold)] mt-1 border border-[var(--gold)]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {invitation.role}
            </span>
          </div>
        </div>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)] text-center">
              You are signed in as <span className="font-bold text-[var(--ink)]">{user.email}</span>. Click below to accept the invitation and join this case.
            </p>
            <Button 
              className="w-full btn-struta-gold h-12 text-base font-bold" 
              onClick={handleAccept} 
              disabled={claiming}
            >
              {claiming ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Accept & Join Group"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)] text-center mb-6">
              You must sign in or create an account with Struta to accept this invitation and access the coordinator dashboard.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-12 font-bold">
                <Link to={`/login?redirect=/invite/${token}`}>Sign In</Link>
              </Button>
              <Button asChild className="btn-struta-gold h-12 font-bold">
                <Link to={`/signup/family?redirect=/invite/${token}`}>
                  Sign Up <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationClaim;
