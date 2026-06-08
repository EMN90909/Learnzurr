export type APIResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type ProjectKind = 'code' | 'animation' | 'movie' | 'game' | 'website-app' | 'graphic-design' | 'beat' | 'all';
export type ProjectPayload = Record<string, unknown>;

const API_BASE = '/api';
let memoryAccessToken = '';
let memoryCSRFToken = '';

function cookieValue(name: string) {
  if (typeof document === 'undefined') return '';
  const item = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.split('=').slice(1).join('=')) : '';
}

function csrfHeader(method = 'GET') {
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  if (!unsafe) return {};
  const token = memoryCSRFToken || cookieValue('learnzur_csrf');
  return token ? { 'X-CSRF-Token': token } : {};
}

export function setAccessToken(token: string) { memoryAccessToken = token; }
export function clearAccessToken() { memoryAccessToken = ''; }
const JSON_HEADERS = Object.freeze({ 'Content-Type': 'application/json' } as const);

function authHeaders() {
  const token = memoryAccessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<APIResult<T>> {
  try {
    const method = options.method || 'GET';
    const headers = { 
      ...JSON_HEADERS, 
      ...authHeaders(), 
      ...csrfHeader(String(method)), 
      ...(options.headers || {}) 
    };
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'same-origin' });
    
    // Handle empty responses or non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      return { ok: false, error: data?.error || data?.message || 'Request failed safely.' };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

export async function apiUpload<T = unknown>(path: string, form: FormData): Promise<APIResult<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, { 
      method: 'POST', 
      headers: { ...authHeaders(), ...csrfHeader('POST') }, 
      body: form, 
      credentials: 'same-origin' 
    });
    const data = (await response.json()) as T;
    if (!response.ok) return { ok: false, error: 'Upload failed safely.' };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

export const endpoints = Object.freeze({
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  logoutAll: '/auth/logout-all',
  session: '/auth/session',
  csrf: '/auth/csrf',
  learnerLogin: '/auth/pin/login',
  parentSignup: '/auth/signup/parent',
  teacherSignup: '/auth/signup/teacher',
  organizationSignup: '/auth/signup/organization',
  projects: '/find/projects',
  projectSearch: '/find/projects/search',
  publishListing: '/lanmat/listings',
  mediaRender: '/media/render',
  mediaDraft: '/media/draft',
  beat: '/media/beat',
  optimizations: '/optimizations',
  classroomRoom: '/classroom/rooms',
  classroomMeetings: '/classroom/meetings',
  sanProjects: '/san/projects',
  sanGameProjects: '/san/game-projects',
  mediaAnimations: '/media/animations',
  mediaMovies: '/media/movies'
} as const);

export type LoginResponse = { accessToken: string; user: { id: string; role: 'admin'|'parent'|'teacher'|'learner'; name: string } };
export type SignupPayload = Record<string, unknown>;

export async function login(identifier: string, password: string, hcaptchaToken = '') { 
  return request<LoginResponse>(endpoints.login, { method: 'POST', body: JSON.stringify({ identifier, password, hcaptchaToken }) }); 
}

export async function learnerLogin(username: string, pin: string, hcaptchaToken = '') { 
  return request<LoginResponse>(endpoints.learnerLogin, { method: 'POST', body: JSON.stringify({ username, pin, hcaptchaToken }) }); 
}

export async function signupParent(payload: SignupPayload) { 
  return request(endpoints.parentSignup, { method: 'POST', body: JSON.stringify(payload) }); 
}

export async function signupTeacher(payload: SignupPayload) { 
  return request(endpoints.teacherSignup, { method: 'POST', body: JSON.stringify(payload) }); 
}

export async function signupOrganization(payload: SignupPayload) { 
  return request(endpoints.organizationSignup, { method: 'POST', body: JSON.stringify(payload) }); 
}

export async function sendOTP(email: string, purpose = 'signup', hcaptchaToken = '') { 
  // Ensure we fetch a CSRF token first if we don't have one to prevent 403 Forbidden
  if (!memoryCSRFToken && typeof document !== 'undefined') {
    await csrf();
  }
  return request('/auth/otp/send', { 
    method: 'POST', 
    body: JSON.stringify({ email, purpose, hcaptchaToken }) 
  }); 
}

export async function forgotPassword(email: string, hcaptchaToken = '') { 
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email, hcaptchaToken }) }); 
}

export async function resetPassword(token: string, password: string, hcaptchaToken = '') { 
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password, hcaptchaToken }) }); 
}

export async function refreshSession() { 
  const result = await request<LoginResponse>(endpoints.refresh, { method: 'POST' }); 
  if (result.ok) setAccessToken(result.data.accessToken); 
  return result; 
}

export async function logout() { 
  const result = await request(endpoints.logout, { method: 'POST' }); 
  clearAccessToken(); 
  return result; 
}

export async function logoutAll() { 
  const result = await request(endpoints.logoutAll, { method: 'POST' }); 
  clearAccessToken(); 
  return result; 
}

export async function currentSession() { return request(endpoints.session); }

export async function csrf() { 
  const result = await request<{ csrfToken: string }>(endpoints.csrf, { method: 'POST' }); 
  if (result.ok) memoryCSRFToken = result.data.csrfToken; 
  return result; 
}

export async function adminUsers(scope = '') { return request(`/admin/users${scope}`); }
export async function adminData(area: string) { return request(`/admin/${area}`); }

export async function saveCodeProject(payload: ProjectPayload) { return request(endpoints.sanProjects, { method: 'POST', body: JSON.stringify(payload) }); }
export async function updateCodeProject(id: string, payload: ProjectPayload) { return request(`/san/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); }
export async function runCodeProject(id: string, payload: ProjectPayload) { return request(`/san/projects/${id}/run`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function publishCodeProject(id: string, payload: ProjectPayload = {}) { return request(`/san/projects/${id}/publish`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function saveGameProject(payload: ProjectPayload) { return request(endpoints.sanGameProjects, { method: 'POST', body: JSON.stringify(payload) }); }
export async function runGameProject(id: string, payload: ProjectPayload) { return request(`/san/game-projects/${id}/run`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function publishGameProject(id: string, payload: ProjectPayload = {}) { return request(`/san/game-projects/${id}/publish`, { method: 'POST', body: JSON.stringify(payload) }); }

export async function saveAnimation(payload: ProjectPayload) { return request(endpoints.mediaAnimations, { method: 'POST', body: JSON.stringify(payload) }); }
export async function renderAnimation(id: string, payload: ProjectPayload = {}) { return request(`/media/animations/${id}/render`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function publishAnimation(id: string, payload: ProjectPayload = {}) { return request(`/media/animations/${id}/publish`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function saveMovie(payload: ProjectPayload) { return request(endpoints.mediaMovies, { method: 'POST', body: JSON.stringify(payload) }); }
export async function renderMovie(id: string, payload: ProjectPayload = {}) { return request(`/media/movies/${id}/render`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function publishMovie(id: string, payload: ProjectPayload = {}) { return request(`/media/movies/${id}/publish`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function saveMediaDraft(payload: ProjectPayload) { return request(endpoints.mediaDraft, { method: 'POST', body: JSON.stringify(payload) }); }
export async function renderMedia(payload: ProjectPayload) { return request(endpoints.mediaRender, { method: 'POST', body: JSON.stringify(payload) }); }
export async function saveBeat(payload: ProjectPayload) { return request(endpoints.beat, { method: 'POST', body: JSON.stringify(payload) }); }
export async function publishProject(payload: ProjectPayload) { return request(endpoints.publishListing, { method: 'POST', body: JSON.stringify(payload) }); }
export async function scanContent(payload: ProjectPayload) { return request('/flag/scan', { method: 'POST', body: JSON.stringify(payload) }); }
export async function flagScan(room_id: string, user_id: string, message: string) { return request('/flag/scan', { method: 'POST', body: JSON.stringify({ room_id, user_id, message }) }); }

export async function exploreProjects(kind: string = 'all') { return request(`/find/projects?kind=${encodeURIComponent(kind)}`); }
export async function searchProjects(query: string, kind: string = 'all') { return request(`/find/projects/search?q=${encodeURIComponent(query)}&kind=${encodeURIComponent(kind)}`); }
export async function likeProject(projectType: string, id: string) { const base = projectType === 'code' || projectType === 'game' ? 'san' : 'media'; return request(`/${base}/projects/${id}/like`, { method: 'POST', body: JSON.stringify({ projectType }) }); }
export async function commentProject(projectType: string, id: string, message: string) { const base = projectType === 'code' || projectType === 'game' ? 'san' : 'media'; return request(`/${base}/projects/${id}/comment`, { method: 'POST', body: JSON.stringify({ projectType, message }) }); }
export async function reportProject(projectType: string, id: string, reason: string) { const base = projectType === 'code' || projectType === 'game' ? 'san' : 'media'; return request(`/${base}/projects/${id}/report`, { method: 'POST', body: JSON.stringify({ projectType, reason }) }); }

export const api = Object.assign(request, {
  upload: apiUpload,
  login,
  learnerLogin,
  signupParent,
  signupTeacher,
  signupOrganization,
  sendOTP,
  forgotPassword,
  resetPassword,
  refreshSession,
  logout,
  logoutAll,
  currentSession,
  csrf,
  adminUsers,
  adminData,
  saveCodeProject,
  updateCodeProject,
  runCodeProject,
  publishCodeProject,
  saveGameProject,
  runGameProject,
  publishGameProject,
  saveAnimation,
  renderAnimation,
  publishAnimation,
  saveMovie,
  renderMovie,
  publishMovie,
  saveMediaDraft,
  renderMedia,
  saveBeat,
  publishProject,
  scanContent,
  exploreProjects,
  searchProjects,
  likeProject,
  commentProject,
  reportProject,
  flagScan
});