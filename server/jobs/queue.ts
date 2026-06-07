type Job = { id: string; name: string; run: () => Promise<unknown>; attempts: number; maxAttempts: number };
const queue: Job[] = [];
let running = false;

export function enqueueJob(name: string, run: () => Promise<unknown>, maxAttempts = 3) {
  const id = `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  queue.push({ id, name, run, attempts: 0, maxAttempts });
  void processQueue();
  return id;
}

export function queueStats() {
  return { queued: queue.length, running };
}

async function processQueue() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    try {
      job.attempts += 1;
      await job.run();
    } catch (error) {
      console.error(`[Queue] ${job.name} failed`, error);
      if (job.attempts < job.maxAttempts) queue.push(job);
    }
  }
  running = false;
}
