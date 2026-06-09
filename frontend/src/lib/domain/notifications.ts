export type NotifyChannel = 'push'|'email'|'in_app';
export type NotificationPreference = { type: string; push: boolean; email: boolean; inApp: boolean };
export function channelsFor(pref: NotificationPreference): NotifyChannel[] { const out: NotifyChannel[]=[]; if(pref.push) out.push('push'); if(pref.email) out.push('email'); if(pref.inApp) out.push('in_app'); return out; }
export function urgencyMinutes(type: string) { if(type.includes('payment')) return 0; if(type.includes('class_starting')) return 5; if(type.includes('grade')) return 30; return 120; }
