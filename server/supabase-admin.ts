import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";
import { config } from "./config";

const require = createRequire(import.meta.url);
const WebSocket = require("ws");

export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocket,
    },
  }
);
