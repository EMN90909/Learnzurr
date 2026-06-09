import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const publicPort = Number(process.env.PORT || 10000);
const frontendPort = Number(process.env.FRONTEND_PORT || 3000);
const apiPort = Number(process.env.API_PORT || 8080);
const host = process.env.HOST || '0.0.0.0';

const children = new Map();
let shuttingDown = false;

function startProcess(name, command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  children.set(name, child);
  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));
  child.on('exit', (code, signal) => {
    children.delete(name);
    if (!shuttingDown && code !== 0) {
      console.error(`[${name}] exited unexpectedly with code=${code} signal=${signal}`);
      shutdown(1);
    }
  });
  return child;
}

function proxyRequest(targetPort, req, res) {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: targetPort,
    method: req.method,
    path: req.url,
    headers: {
      ...req.headers,
      host: req.headers.host,
      'x-forwarded-host': req.headers.host || '',
      'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'https',
      'x-forwarded-for': req.socket.remoteAddress || ''
    }
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstream.on('error', (error) => {
    const body = JSON.stringify({ ok: false, error: 'upstream_unavailable', detail: error.message });
    res.writeHead(502, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
    res.end(body);
  });

  req.pipe(upstream);
}

async function waitForHealth(url, name, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          res.statusCode && res.statusCode < 500 ? resolve() : reject(new Error(`${name} returned ${res.statusCode}`));
        });
        req.setTimeout(1500, () => req.destroy(new Error(`${name} timed out`)));
        req.on('error', reject);
      });
      return;
    } catch (error) {
      if (i === attempts - 1) throw error;
      await delay(500);
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const [name, child] of children.entries()) {
    console.log(`[supervisor] stopping ${name}`);
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 2500).unref();
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

startProcess('api', '/usr/local/bin/learnzur-api', [], { API_PORT: String(apiPort) });
startProcess('frontend', 'node', ['frontend/build'], {
  PORT: String(frontendPort),
  HOST: '0.0.0.0',
  PUBLIC_API_BASE_URL: '/api'
});

await Promise.all([
  waitForHealth(`http://127.0.0.1:${apiPort}/api/health`, 'api'),
  waitForHealth(`http://127.0.0.1:${frontendPort}/`, 'frontend')
]);

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (req.url === '/healthz') {
    const body = JSON.stringify({ ok: true, service: 'learnzur-web', frontendPort, apiPort });
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
    res.end(body);
    return;
  }

  if (req.url.startsWith('/api/')) {
    proxyRequest(apiPort, req, res);
    return;
  }

  proxyRequest(frontendPort, req, res);
});

server.on('upgrade', (req, socket, head) => {
  socket.destroy();
});

server.listen(publicPort, host, () => {
  console.log(`[supervisor] Learnzur listening on ${host}:${publicPort}`);
  console.log(`[supervisor] frontend -> 127.0.0.1:${frontendPort}`);
  console.log(`[supervisor] api -> 127.0.0.1:${apiPort}`);
});
