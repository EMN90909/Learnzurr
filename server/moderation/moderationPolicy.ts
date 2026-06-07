export type ModerationSeverity = "ALLOW" | "LOW" | "MEDIUM" | "HIGH" | "HATE_SPEECH" | "FALSE_INFORMATION" | "USER_RISK";

export type ModerationDecision = {
  severity: ModerationSeverity;
  action: "allow" | "allow_with_tracking" | "flag_for_review" | "auto_block" | "auto_block_and_report" | "temporary_restriction";
  durationDays: number;
  reason: string;
  matchedTerms: string[];
};

const containsAny = (text: string, terms: string[]) => terms.filter((term) => text.includes(term));

const lowTerms = ["stupid", "idiot", "fool", "nonsense"];
const mediumTerms = ["scam", "fraud", "fake", "liar", "thief", "useless", "worthless"];
const highTerms = ["obscene", "sexual", "porn", "nude", "kill yourself", "self harm"];
const hateTerms = ["hate speech", "ethnic slur", "racist", "tribal hate", "genocide", "terrorist threat"];
const falseInfoTerms = ["fake license", "false certificate", "not registered but", "pretend to be", "fake funeral home", "fake vendor"];
const riskTerms = ["illegal", "unlawful", "weapon", "stolen", "harmful content", "exploit", "blackmail", "threaten"];

export function moderateText(rawText: unknown, context: "chat" | "memorial" | "visit" | "listing" | "account" = "chat"): ModerationDecision {
  const text = String(rawText || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return { severity: "ALLOW", action: "allow", durationDays: 0, reason: "No content to review.", matchedTerms: [] };

  const hate = containsAny(text, hateTerms);
  if (hate.length) return { severity: "HATE_SPEECH", action: "auto_block_and_report", durationDays: 14, reason: "Hate speech or targeted abusive content detected.", matchedTerms: hate };

  const falseInfo = containsAny(text, falseInfoTerms);
  if (falseInfo.length) return { severity: "FALSE_INFORMATION", action: "temporary_restriction", durationDays: 14, reason: "Possible false information or misleading service representation detected.", matchedTerms: falseInfo };

  const risk = containsAny(text, riskTerms);
  if (risk.length) return { severity: "USER_RISK", action: "temporary_restriction", durationDays: 14, reason: "User risk, misuse, unlawful, or harmful activity detected.", matchedTerms: risk };

  const high = containsAny(text, highTerms);
  if (high.length) return { severity: "HIGH", action: "auto_block", durationDays: context === "memorial" ? 5 : 5, reason: "High-risk obscene, sexual, harmful, or blocked content detected.", matchedTerms: high };

  const medium = containsAny(text, mediumTerms);
  if (medium.length) return { severity: "MEDIUM", action: "flag_for_review", durationDays: 3, reason: "Moderate insulting or abusive language detected.", matchedTerms: medium };

  const low = containsAny(text, lowTerms);
  if (low.length) return { severity: "LOW", action: "allow_with_tracking", durationDays: 0, reason: "Mild language detected and tracked for patterns.", matchedTerms: low };

  return { severity: "ALLOW", action: "allow", durationDays: 0, reason: "No policy issue detected.", matchedTerms: [] };
}

export function shouldRestrict(decision: ModerationDecision) {
  return ["MEDIUM", "HIGH", "HATE_SPEECH", "FALSE_INFORMATION", "USER_RISK"].includes(decision.severity);
}
