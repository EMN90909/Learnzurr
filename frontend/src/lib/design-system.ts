export const designTokens = {
  radius: { sm: '14px', md: '18px', lg: '22px', xl: '34px', full: '999px' },
  colors: {
    background: 'hsl(210 20% 97%)',
    foreground: 'hsl(200 20% 15%)',
    primary: 'hsl(179 50% 70%)',
    secondary: 'hsl(175 40% 60%)',
    border: 'hsl(200 10% 90%)',
    muted: 'hsl(200 10% 45%)'
  },
  shadows: {
    card: '0 14px 44px hsl(200 20% 15% / .08)',
    soft: '0 24px 70px hsl(200 20% 15% / .10)',
    focus: '0 0 0 4px hsl(179 50% 70% / .22)'
  }
} as const;

export type RoleTone = 'parent' | 'teacher' | 'learner' | 'admin';

export const roleTone: Record<RoleTone, { title: string; description: string; accent: string; home: string }> = {
  parent: { title: 'Parent command centre', description: 'Children, payments, grades and teacher conversations in one calm workspace.', accent: 'family safety', home: '/parent/dashboard' },
  teacher: { title: 'Teacher studio', description: 'Classes, LMS, earnings and classroom delivery tools for verified educators.', accent: 'teaching craft', home: '/teacher/dashboard' },
  learner: { title: 'Learner cockpit', description: 'Classes, tasks, creative tools, streaks and safe class community.', accent: 'active progress', home: '/learner/dashboard' },
  admin: { title: 'Platform operations', description: 'Verification, treasury, moderation, audit logs, configuration and support.', accent: 'system control', home: '/admin/dashboard' }
};

export function buildPageMeta(title: string, description: string) {
  return { title: `${title} · Learnzur`, description, ogTitle: title, ogDescription: description };
}
