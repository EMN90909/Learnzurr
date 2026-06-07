import { config } from "../config";

type Json = Record<string, any>;

const resendFetch = async (path: string, init: RequestInit = {}) => {
  if (!config.resendApiKey) throw new Error("RESEND_API_KEY is not configured.");
  const response = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((json as any)?.message || (json as any)?.error || "Resend domain request failed.");
  return json;
};

export const resendDomainService = {
  create(name = "struta.top") {
    return resendFetch("/domains", { method: "POST", body: JSON.stringify({ name }) });
  },
  get(id: string) {
    if (!id) throw new Error("Missing Resend domain id.");
    return resendFetch(`/domains/${encodeURIComponent(id)}`);
  },
  verify(id: string) {
    if (!id) throw new Error("Missing Resend domain id.");
    return resendFetch(`/domains/${encodeURIComponent(id)}/verify`, { method: "POST", body: JSON.stringify({}) });
  },
  update(payload: Json) {
    const { id, ...body } = payload || {};
    if (!id) throw new Error("Missing Resend domain id.");
    return resendFetch(`/domains/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  list() {
    return resendFetch("/domains");
  },
  remove(id: string) {
    if (!id) throw new Error("Missing Resend domain id.");
    return resendFetch(`/domains/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
