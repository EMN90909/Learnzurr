export const teacherScreens = [
  {
    "key": "dashboard",
    "title": "Dashboard",
    "href": "/teacher/dashboard",
    "api": "/api/teacher/dashboard",
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
    "key": "profile",
    "title": "Profile",
    "href": "/teacher/profile",
    "api": "/api/teacher/profile",
    "priority": 2,
    "emptyState": "Profile data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/teacher/classes",
    "api": "/api/teacher/classes",
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
    "key": "lms",
    "title": "Lms",
    "href": "/teacher/lms",
    "api": "/api/teacher/lms",
    "priority": 4,
    "emptyState": "Lms data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "timetable",
    "title": "Timetable",
    "href": "/teacher/timetable",
    "api": "/api/teacher/timetable",
    "priority": 5,
    "emptyState": "Timetable data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/teacher/classroom",
    "api": "/api/teacher/classroom",
    "priority": 6,
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
    "key": "meetings",
    "title": "Meetings",
    "href": "/teacher/meetings",
    "api": "/api/teacher/meetings",
    "priority": 7,
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
    "key": "earnings",
    "title": "Earnings",
    "href": "/teacher/earnings",
    "api": "/api/teacher/earnings",
    "priority": 8,
    "emptyState": "Earnings data will appear after the Supabase-backed Go API returns records for this role.",
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
    "key": "payouts",
    "title": "Payouts",
    "href": "/teacher/payouts",
    "api": "/api/teacher/payouts",
    "priority": 9,
    "emptyState": "Payouts data will appear after the Supabase-backed Go API returns records for this role.",
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
    "href": "/teacher/lanmat",
    "api": "/api/teacher/lanmat",
    "priority": 10,
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
    "key": "messages",
    "title": "Messages",
    "href": "/teacher/messages",
    "api": "/api/teacher/messages",
    "priority": 11,
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
    "key": "notifications",
    "title": "Notifications",
    "href": "/teacher/notifications",
    "api": "/api/teacher/notifications",
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
    "href": "/teacher/settings",
    "api": "/api/teacher/settings",
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
