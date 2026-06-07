import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadServerEnv() {
  const mode = process.env.NODE_ENV || "development";
  if (mode === "production") {
    return;
  }

  for (const file of [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"]) {
    dotenv.config({ path: path.join(rootDir, file), override: false });
  }
}

loadServerEnv();
