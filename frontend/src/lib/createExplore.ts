
export type CreativeKind = 'code' | 'animation' | 'movie' | 'game';
export const createKinds = Object.freeze([
  { kind: 'code', title: 'Code Project', path: '/learner/create/code', engine: 'San', actions: ['Choose HTML, CSS, JS, PHP, SvelteKit, or MicroPython', 'Run in a safe Docker sandbox', 'Stream output and errors', 'Publish when safe'] },
  { kind: 'animation', title: 'Animation Project', path: '/learner/create/animate', engine: 'Media', actions: ['Add scenes', 'Add text, images, and shapes', 'Set timing and movement', 'Render and publish'] },
  { kind: 'movie', title: 'Movie Project', path: '/learner/create/movie', engine: 'Media', actions: ['Upload clips/images', 'Arrange clips', 'Add text, transitions, and music', 'Render and publish'] },
  { kind: 'game', title: 'Game Project', path: '/learner/create/game', engine: 'San + Media', actions: ['Write game logic', 'Add image assets', 'Preview and play', 'Publish when safe'] }
] as const);

export const createSafetyRules = Object.freeze([
  'Learners edit, delete, and publish only their own projects.',
  'Private drafts never appear in Explore.',
  'Published projects are scanned by Flag before public discovery.',
  'Code runs inside an isolated Docker sandbox with 10MB RAM and 0.05 CPU limits.',
  'Project titles, descriptions, comments, and reports are sanitized and logged.',
  'Explore shows only approved public content and hides private learner data.'
] as const);

export const createSpeedRules = Object.freeze([
  'Code output streams through SSE-style responses where needed.',
  'Autosave is debounced so low-end phones stay responsive.',
  'Animation and movie rendering is queued through Media jobs.',
  'Explore results are paginated and cached for popular/recent projects.',
  'Cards use thumbnails first and load full project files only when opened.'
] as const);

export const exploreFilters = Object.freeze(['all', 'code', 'animation', 'movie', 'game', 'recent', 'popular', 'classmates'] as const);
