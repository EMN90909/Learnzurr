export const learnerScreens = [
  {
    "key": "dashboard",
    "title": "Dashboard",
    "href": "/learner/dashboard",
    "api": "/api/learner/dashboard",
    "priority": 1,
    "emptyState": "Dashboard data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "library",
    "title": "Library",
    "href": "/learner/library",
    "api": "/api/learner/library",
    "priority": 2,
    "emptyState": "Library data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "classroom",
    "title": "Classroom",
    "href": "/learner/classroom",
    "api": "/api/learner/classroom",
    "priority": 3,
    "emptyState": "Classroom data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "tasks",
    "title": "Tasks",
    "href": "/learner/tasks",
    "api": "/api/learner/tasks",
    "priority": 4,
    "emptyState": "Tasks data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "create",
    "title": "Create",
    "href": "/learner/create",
    "api": "/api/learner/create",
    "priority": 5,
    "emptyState": "Create data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "explore",
    "title": "Explore",
    "href": "/learner/explore",
    "api": "/api/learner/explore",
    "priority": 6,
    "emptyState": "Explore data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "lanmat",
    "title": "Lanmat",
    "href": "/learner/lanmat",
    "api": "/api/learner/lanmat",
    "priority": 7,
    "emptyState": "Lanmat data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "gamfy",
    "title": "Gamfy",
    "href": "/learner/gamfy",
    "api": "/api/learner/gamfy",
    "priority": 8,
    "emptyState": "Gamfy data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "contests",
    "title": "Contests",
    "href": "/learner/contests",
    "api": "/api/learner/contests",
    "priority": 9,
    "emptyState": "Contests data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "chat",
    "title": "Chat",
    "href": "/learner/chat",
    "api": "/api/learner/chat",
    "priority": 10,
    "emptyState": "Chat data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "meetings",
    "title": "Meetings",
    "href": "/learner/meetings",
    "api": "/api/learner/meetings",
    "priority": 11,
    "emptyState": "Meetings data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "notifications",
    "title": "Notifications",
    "href": "/learner/notifications",
    "api": "/api/learner/notifications",
    "priority": 12,
    "emptyState": "Notifications data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  },
  {
    "key": "settings",
    "title": "Settings",
    "href": "/learner/settings",
    "api": "/api/learner/settings",
    "priority": 13,
    "emptyState": "Settings data will appear after the Supabase-backed Go API returns records for this role.",
    "security": [
      "role guard",
      "audit when changed",
      "sanitize inputs",
      "never expose service keys"
    ],
    "actions": [
      "View records",
      "Create or update safely",
      "Export audit context"
    ]
  }
] as const;
