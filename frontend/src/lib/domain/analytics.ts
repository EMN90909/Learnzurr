export type SearchEvent = { query: string; resultCount: number; role?: string; createdAt: string };
export function normalizeQuery(query: string) { return query.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,' ').trim().slice(0,120); }
export function isZeroResultOpportunity(event: SearchEvent) { return normalizeQuery(event.query).length > 2 && event.resultCount === 0; }
export function subjectSlug(subject: string) { return normalizeQuery(subject).replace(/\s+/g,'-'); }
