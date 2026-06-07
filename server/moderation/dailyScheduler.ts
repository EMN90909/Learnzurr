import { runDailyModerationScan } from "./moderationWorker";

const DEFAULT_SCAN_HOUR = 3;
const DEFAULT_SCAN_MINUTE = 15;
let schedulerStarted = false;
let timer: NodeJS.Timeout | null = null;
let scanRunning = false;

function getScanTime() {
  const hour = Number(process.env.MODERATION_SCAN_HOUR ?? DEFAULT_SCAN_HOUR);
  const minute = Number(process.env.MODERATION_SCAN_MINUTE ?? DEFAULT_SCAN_MINUTE);
  return {
    hour: Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULT_SCAN_HOUR,
    minute: Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : DEFAULT_SCAN_MINUTE,
  };
}

function msUntilNextRun() {
  const now = new Date();
  const { hour, minute } = getScanTime();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function runScheduledScan() {
  if (scanRunning) {
    console.warn("[moderation-scheduler] Previous moderation scan is still running; skipping this tick.");
    return;
  }
  scanRunning = true;
  try {
    console.log("[moderation-scheduler] Starting daily moderation scan.");
    const result = await runDailyModerationScan();
    console.log(`[moderation-scheduler] Scan complete. scanned=${result.scanned} failed=${result.failed}`);
  } catch (error) {
    console.error("[moderation-scheduler] Daily moderation scan failed:", error);
  } finally {
    scanRunning = false;
  }
}

function scheduleNextRun() {
  const delay = msUntilNextRun();
  timer = setTimeout(async () => {
    await runScheduledScan();
    scheduleNextRun();
  }, delay);
  timer.unref?.();
  const nextAt = new Date(Date.now() + delay).toISOString();
  console.log(`[moderation-scheduler] Next daily moderation scan scheduled for ${nextAt}.`);
}

export function startDailyModerationScheduler() {
  if (schedulerStarted) return;
  if (process.env.DISABLE_DAILY_MODERATION_SCAN === "true") {
    console.log("[moderation-scheduler] Daily moderation scan disabled by DISABLE_DAILY_MODERATION_SCAN=true.");
    return;
  }
  schedulerStarted = true;
  scheduleNextRun();
}

export function stopDailyModerationScheduler() {
  if (timer) clearTimeout(timer);
  timer = null;
  schedulerStarted = false;
}
