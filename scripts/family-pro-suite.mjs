import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchServer() {
  const file = "server/index.ts";
  let src = read(file);
  if (!src || src.includes('/api/family/pro/ai-generate')) return;

  const routes = `
const hasFamilyPro = (profile) => {
  if (!profile) return false;
  if (String(profile.role || '').toLowerCase() === 'admin') return true;
  const planCode = String(profile.plan_code || profile.subscription?.plan_code || profile.subscription?.plan_name || 'free').toLowerCase();
  const status = String(profile.plan_status || profile.subscription_status || profile.subscription?.status || '').toLowerCase();
  const expiresAt = profile.plan_expires_at || profile.subscription?.expires_at || profile.subscription?.current_period_end || null;
  const validExpiry = !expiresAt || new Date(expiresAt).getTime() > Date.now();
  return planCode !== 'free' && ['paid', 'active', 'trialing'].includes(status) && validExpiry;
};

const requireFamilyProActor = async (req, res) => {
  const { getAuthenticatedActor } = await import('./auth');
  const actor = await getAuthenticatedActor(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  if (String(actor.role || '').toLowerCase() !== 'family' && String(actor.role || '').toLowerCase() !== 'admin') {
    res.status(403).json({ error: 'Family access required.' });
    return null;
  }
  if (!hasFamilyPro(actor)) {
    res.status(402).json({ error: 'Family Pro plan required.' });
    return null;
  }
  return actor;
};

const familyAiConfigured = () => Boolean(process.env.FAMILY_AI_GO_URL || process.env.GO_AI_SERVICE_URL);

const generateFamilyAI = async (kind, prompt, context) => {
  const goUrl = process.env.FAMILY_AI_GO_URL || process.env.GO_AI_SERVICE_URL || '';
  if (!goUrl) throw new Error('Go AI service is not configured. Set FAMILY_AI_GO_URL.');
  const response = await fetch(goUrl.replace(/\/$/, '') + '/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: sanitizeText(kind, 40), prompt: sanitizeText(prompt, 2000), context: sanitizeText(context, 4000) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'AI generation failed.');
  return String(data?.content || '').trim();
};

app.post('/api/family/pro/ai-generate', rateLimit('family-pro-ai', 20, 60 * 60_000), async (req, res) => {
  try {
    const actor = await requireFamilyProActor(req, res);
    if (!actor) return;
    if (!familyAiConfigured()) return res.status(503).json({ error: 'AI is not configured.' });
    const kind = sanitizeText(req.body?.kind || 'eulogy', 40);
    const title = sanitizeText(req.body?.title || kind, 140);
    const content = await generateFamilyAI(kind, req.body?.prompt || '', req.body?.context || '');
    const { data, error } = await (await import('./supabase-admin')).supabaseAdmin.from('family_pro_assets').insert({ user_id: actor.id, asset_type: kind === 'banner' ? 'banner' : kind === 'social_post' ? 'social_post' : 'eulogy', title, content, metadata: { prompt: sanitizeText(req.body?.prompt, 1000) } }).select('*').single();
    if (error) throw error;
    res.json({ ok: true, asset: data, content });
  } catch (error) {
    console.error('[family/pro/ai-generate]', error);
    res.status(500).json({ error: error?.message || 'Could not generate content.' });
  }
});

app.post('/api/family/pro/checklist', rateLimit('family-pro-checklist', 60, 60 * 60_000), async (req, res) => {
  try {
    const actor = await requireFamilyProActor(req, res);
    if (!actor) return;
    const title = sanitizeText(req.body?.title, 180);
    if (!title) return res.status(400).json({ error: 'Checklist title is required.' });
    const { data, error } = await (await import('./supabase-admin')).supabaseAdmin.from('family_pro_checklist_items').insert({ user_id: actor.id, title, due_date: req.body?.due_date || null, priority: sanitizeText(req.body?.priority || 'normal', 20) }).select('*').single();
    if (error) throw error;
    res.json({ ok: true, item: data });
  } catch (error) { res.status(500).json({ error: 'Could not save checklist item.' }); }
});

app.post('/api/family/pro/reminders', rateLimit('family-pro-reminders', 40, 60 * 60_000), async (req, res) => {
  try {
    const actor = await requireFamilyProActor(req, res);
    if (!actor) return;
    const title = sanitizeText(req.body?.title, 180);
    const remindAt = new Date(String(req.body?.remind_at || '')).toISOString();
    const { data, error } = await (await import('./supabase-admin')).supabaseAdmin.from('family_pro_reminders').insert({ user_id: actor.id, title, remind_at: remindAt, channel: sanitizeText(req.body?.channel || 'email', 20) }).select('*').single();
    if (error) throw error;
    res.json({ ok: true, reminder: data });
  } catch (error) { res.status(500).json({ error: 'Could not save reminder.' }); }
});

app.post('/api/family/pro/private-link', rateLimit('family-pro-private-link', 20, 60 * 60_000), async (req, res) => {
  try {
    const actor = await requireFamilyProActor(req, res);
    if (!actor) return;
    const token = crypto.randomUUID().replace(/-/g, '');
    const title = sanitizeText(req.body?.title || 'Private memorial link', 160);
    const { data, error } = await (await import('./supabase-admin')).supabaseAdmin.from('family_private_links').insert({ user_id: actor.id, title, token, expires_at: req.body?.expires_at || null, max_views: Number(req.body?.max_views || 0) || null }).select('*').single();
    if (error) throw error;
    res.json({ ok: true, link: data, url: (process.env.PUBLIC_APP_URL || 'https://strutan.onrender.com') + '/memorial/private/' + token });
  } catch (error) { res.status(500).json({ error: 'Could not create private link.' }); }
});

app.post('/api/family/pro/private-memorial', rateLimit('family-pro-private-memorial', 20, 60 * 60_000), async (req, res) => {
  try {
    const actor = await requireFamilyProActor(req, res);
    if (!actor) return;
    const title = sanitizeText(req.body?.title || 'Private memorial', 160);
    const password = String(req.body?.password || '');
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const slug = sanitizeText(req.body?.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''), 80) + '-' + crypto.randomUUID().slice(0, 8);
    const salt = crypto.randomUUID();
    const password_hash = salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
    const { data, error } = await (await import('./supabase-admin')).supabaseAdmin.from('family_private_memorials').insert({ user_id: actor.id, title, private_slug: slug, password_hash, hint: sanitizeText(req.body?.hint, 160), is_enabled: true }).select('*').single();
    if (error) throw error;
    res.json({ ok: true, memorial: { ...data, password_hash: undefined }, url: (process.env.PUBLIC_APP_URL || 'https://strutan.onrender.com') + '/memorial/private/' + slug });
  } catch (error) { console.error('[family/pro/private-memorial]', error); res.status(500).json({ error: 'Could not create private memorial.' }); }
});

app.post('/api/family/pro/support', rateLimit('family-pro-support', 12, 60 * 60_000), async (req, res) => {
  try {
    const actor = await requireFamilyProActor(req, res);
    if (!actor) return;
    const subject = sanitizeText(req.body?.subject, 180);
    const message = sanitizeText(req.body?.message, 2000);
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required.' });
    const { data, error } = await (await import('./supabase-admin')).supabaseAdmin.from('family_priority_support_tickets').insert({ user_id: actor.id, subject, message, status: 'priority_open', priority: 'high' }).select('*').single();
    if (error) throw error;
    res.json({ ok: true, ticket: data });
  } catch (error) { res.status(500).json({ error: 'Could not create support ticket.' }); }
});
`;

  src = src.replace('\napp.post("/api/admin/email-campaigns/send",', routes + '\napp.post("/api/admin/email-campaigns/send",');
  write(file, src);
}

patchServer();
