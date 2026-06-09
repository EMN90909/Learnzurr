export const adminScreens = [
  {
    "key": "dashboard",
    "title": "Dashboard",
    "href": "/admin/dashboard",
    "api": "/api/admin/dashboard",
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
    "key": "users",
    "title": "Users",
    "href": "/admin/users",
    "api": "/api/admin/users",
    "priority": 2,
    "emptyState": "Users data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "classes",
    "title": "Classes",
    "href": "/admin/classes",
    "api": "/api/admin/classes",
    "priority": 3,
    "emptyState": "Classes data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "mearn",
    "title": "Mearn",
    "href": "/admin/mearn",
    "api": "/api/admin/mearn",
    "priority": 4,
    "emptyState": "Mearn data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/admin/lanmat",
    "api": "/api/admin/lanmat",
    "priority": 5,
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
    "key": "flag",
    "title": "Flag",
    "href": "/admin/flag",
    "api": "/api/admin/flag",
    "priority": 6,
    "emptyState": "Flag data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/admin/gamfy",
    "api": "/api/admin/gamfy",
    "priority": 7,
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
    "href": "/admin/contests",
    "api": "/api/admin/contests",
    "priority": 8,
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
    "key": "events",
    "title": "Events",
    "href": "/admin/events",
    "api": "/api/admin/events",
    "priority": 9,
    "emptyState": "Events data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "sponsors",
    "title": "Sponsors",
    "href": "/admin/sponsors",
    "api": "/api/admin/sponsors",
    "priority": 10,
    "emptyState": "Sponsors data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "ngo",
    "title": "Ngo",
    "href": "/admin/ngo",
    "api": "/api/admin/ngo",
    "priority": 11,
    "emptyState": "Ngo data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "find",
    "title": "Find",
    "href": "/admin/find",
    "api": "/api/admin/find",
    "priority": 12,
    "emptyState": "Find data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "media",
    "title": "Media",
    "href": "/admin/media",
    "api": "/api/admin/media",
    "priority": 13,
    "emptyState": "Media data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "security",
    "title": "Security",
    "href": "/admin/security",
    "api": "/api/admin/security",
    "priority": 14,
    "emptyState": "Security data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/admin/notifications",
    "api": "/api/admin/notifications",
    "priority": 15,
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
    "key": "help",
    "title": "Help",
    "href": "/admin/help",
    "api": "/api/admin/help",
    "priority": 16,
    "emptyState": "Help data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/admin/settings",
    "api": "/api/admin/settings",
    "priority": 17,
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
