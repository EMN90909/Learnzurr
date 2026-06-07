export type Role = 'parent' | 'teacher' | 'organization' | 'learner' | 'admin';
export type AdultSignupKind = 'teacher' | 'organization';
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type SessionUser = { id: string; role: Role; name: string; accessToken: string };
export type LoginResponse = { accessToken: string; refreshToken?: string; user: { id: string; role: Role; name: string } };
export type DashboardCard = { title: string; value: string; note: string };
export type EngineName = 'gamfy'|'mearn'|'lms'|'classroom'|'san'|'lanmat'|'notify'|'media'|'find'|'flag';
export type EngineHealth = { engine: EngineName; status: 'ok'|'degraded'; namespace: string };

export type CreationKind = 'animation' | 'video' | 'movie' | 'game' | 'code' | 'poster' | 'storyboard' | 'beat';
export type CreationAgeMode = '8-12' | '13-18';
export type MarketplaceLicense = 'School project use' | 'Personal listening/viewing' | 'Teacher classroom use' | 'Royalty marketplace item';
