export const parentScreens = [
  {
    "key": "dashboard",
    "title": "Dashboard",
    "href": "/parent/dashboard",
    "api": "/api/parent/dashboard",
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
    "key": "children",
    "title": "Children",
    "href": "/parent/children",
    "api": "/api/parent/children",
    "priority": 2,
    "emptyState": "Children data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "progress",
    "title": "Progress",
    "href": "/parent/progress",
    "api": "/api/parent/progress",
    "priority": 3,
    "emptyState": "Progress data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/parent/classes",
    "api": "/api/parent/classes",
    "priority": 4,
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
    "key": "payments",
    "title": "Payments",
    "href": "/parent/payments",
    "api": "/api/parent/payments",
    "priority": 5,
    "emptyState": "Payments data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "results",
    "title": "Results",
    "href": "/parent/results",
    "api": "/api/parent/results",
    "priority": 6,
    "emptyState": "Results data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "messages",
    "title": "Messages",
    "href": "/parent/messages",
    "api": "/api/parent/messages",
    "priority": 7,
    "emptyState": "Messages data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "chat-monitor",
    "title": "Chat Monitor",
    "href": "/parent/chat-monitor",
    "api": "/api/parent/chat-monitor",
    "priority": 8,
    "emptyState": "Chat Monitor data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/parent/notifications",
    "api": "/api/parent/notifications",
    "priority": 9,
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
    "href": "/parent/settings",
    "api": "/api/parent/settings",
    "priority": 10,
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
