// Run: node --test src/lib/store.test.ts (Node 22.18+ strips types natively).
// Talks only to a fake Upstash REST server on 127.0.0.1: no real Redis, no network.
import { registerHooks } from 'node:module';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AddressInfo } from 'node:net';
import type { OrderRecord } from '@/types/commerce';

const srcDir = path.resolve(process.cwd(), 'src');

registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = specifier.startsWith('@/')
      ? pathToFileURL(path.join(srcDir, specifier.slice(2))).href
      : specifier;
    try {
      return nextResolve(target, context);
    } catch {
      // `next/server` has no exports map, so ESM needs the `.js` file named.
      try {
        return nextResolve(`${target}.ts`, context);
      } catch {
        return nextResolve(`${target}.js`, context);
      }
    }
  }
});

const { saveOrder, findOrderById } = await import('./store');

const ENV_NAMES = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'KV_REST_API_READ_ONLY_TOKEN'
] as const;

interface SeenRequest {
  method: string;
  path: string;
  token: string;
  body: string;
}

// Mimics Upstash REST: POST /set/<key> stores the raw body as the string value,
// GET /get/<key> answers {"result": <string or null>}, wrong token answers 401.
class FakeUpstash {
  readonly values = new Map<string, string>();
  readonly seen: SeenRequest[] = [];
  failGets = false;
  failSets = false;
  private readonly server: http.Server;
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
    this.server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString('utf-8');
      });
      req.on('end', () => {
        const auth = req.headers.authorization ?? '';
        const reqPath = decodeURIComponent(req.url ?? '');
        this.seen.push({ method: req.method ?? '', path: reqPath, token: auth.replace(/^Bearer /, ''), body });
        res.setHeader('Content-Type', 'application/json');
        if (auth !== `Bearer ${this.token}`) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        const [, command, key] = reqPath.split('/');
        if (command === 'set' && this.failSets) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'temporary failure' }));
        } else if (command === 'set' && req.method === 'POST' && key) {
          this.values.set(key, body);
          res.end(JSON.stringify({ result: 'OK' }));
        } else if (command === 'get' && this.failGets) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'temporary failure' }));
        } else if (command === 'get' && key) {
          res.end(JSON.stringify({ result: this.values.get(key) ?? null }));
        } else {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'unsupported' }));
        }
      });
    });
  }

  async start(): Promise<string> {
    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    const { port } = this.server.address() as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  reset(): void {
    this.values.clear();
    this.seen.length = 0;
    this.failGets = false;
    this.failSets = false;
  }
}

const upstash = new FakeUpstash('upstash-token-test');
const kv = new FakeUpstash('kv-token-test');
let upstashUrl = '';
let kvUrl = '';
let tmpDir = '';
const savedTmp = process.env.TMPDIR;
const savedVercel = process.env.VERCEL;

function order(orderId: string): OrderRecord {
  return {
    orderId,
    createdAt: '2026-11-25T10:00:00.000Z',
    status: 'confirmed',
    items: [
      {
        productId: 'ring-1',
        name: 'Test Ring',
        finishShort: 'Gold',
        size: '7',
        qty: 1,
        unitPrice: 1650,
        lineTotal: 1650,
        image: '/ring.jpg'
      }
    ],
    pricing: { currency: 'PKR', subtotal: 1650, discount: 0, shipping: 250, total: 1900, promoApplied: null },
    customer: {
      fullName: 'Test Buyer',
      email: 'buyer@example.test',
      phone: '03001234567',
      address: '1 Test Street',
      city: 'Lahore'
    },
    giftNote: '',
    payment: { provider: 'zevora_cod', method: 'cod', status: 'pending_cod', transactionId: 'T-1' }
  };
}

before(async () => {
  upstashUrl = await upstash.start();
  kvUrl = await kv.start();
  // File fallback must never touch the repo's .data: VERCEL=1 sends it to os.tmpdir(), pointed at a temp dir.
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zevora-store-test-'));
  process.env.TMPDIR = tmpDir;
  process.env.VERCEL = '1';
});

beforeEach(async () => {
  for (const name of ENV_NAMES) delete process.env[name];
  upstash.reset();
  kv.reset();
  await fs.rm(path.join(tmpDir, 'zevora-data'), { recursive: true, force: true });
});

after(async () => {
  await upstash.stop();
  await kv.stop();
  if (savedTmp === undefined) delete process.env.TMPDIR;
  else process.env.TMPDIR = savedTmp;
  if (savedVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = savedVercel;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('Vercel KV_REST_API_* names alone store the order in Redis and tracking finds it', async () => {
  process.env.KV_REST_API_URL = `${kvUrl}/`;
  process.env.KV_REST_API_TOKEN = '  kv-token-test  ';
  process.env.KV_REST_API_READ_ONLY_TOKEN = 'read-only-must-not-be-used';

  await saveOrder(order('ZEV-2026-4821'));

  assert.deepEqual(
    kv.seen.filter((r) => r.method === 'POST').map((r) => [r.path, r.token]),
    [['/set/zevora:orders', 'kv-token-test']]
  );
  const found = await findOrderById('  zev-2026-4821 ');
  assert.equal(found?.orderId, 'ZEV-2026-4821');
  assert.ok(!kv.seen.some((r) => r.token === 'read-only-must-not-be-used'));
});

test('stored value is the JSON array text, not double-encoded', async () => {
  process.env.KV_REST_API_URL = kvUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';

  await saveOrder(order('ZEV-2026-1111'));

  const raw = kv.values.get('zevora:orders') ?? '';
  const parsed: unknown = JSON.parse(raw);
  assert.ok(Array.isArray(parsed), `expected a JSON array, got ${raw.slice(0, 40)}`);
  assert.equal((parsed as OrderRecord[])[0]?.orderId, 'ZEV-2026-1111');
});

test('second order is added in front of the first and both stay findable', async () => {
  process.env.KV_REST_API_URL = kvUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';

  await saveOrder(order('ZEV-2026-1001'));
  await saveOrder(order('ZEV-2026-1002'));

  const stored = JSON.parse(kv.values.get('zevora:orders') ?? '[]') as OrderRecord[];
  assert.deepEqual(stored.map((o) => o.orderId), ['ZEV-2026-1002', 'ZEV-2026-1001']);
  assert.equal((await findOrderById('ZEV-2026-1001'))?.orderId, 'ZEV-2026-1001');
});

test('UPSTASH_REDIS_REST_* pair wins when both name sets are set', async () => {
  process.env.UPSTASH_REDIS_REST_URL = upstashUrl;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token-test';
  process.env.KV_REST_API_URL = kvUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';

  await saveOrder(order('ZEV-2026-2222'));

  assert.ok(upstash.values.has('zevora:orders'));
  assert.equal(kv.seen.length, 0);
});

test('an incomplete UPSTASH pair falls through to the complete KV pair, never mixing them', async () => {
  process.env.UPSTASH_REDIS_REST_URL = upstashUrl;
  process.env.UPSTASH_REDIS_REST_TOKEN = '   ';
  process.env.KV_REST_API_URL = kvUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';

  await saveOrder(order('ZEV-2026-3333'));

  assert.equal(upstash.seen.length, 0);
  assert.ok(kv.values.has('zevora:orders'));
});

test('UPSTASH url with only a KV token is no Redis config (no mixed pair)', async () => {
  process.env.UPSTASH_REDIS_REST_URL = upstashUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';

  await saveOrder(order('ZEV-2026-4444'));

  assert.equal(upstash.seen.length, 0);
  assert.equal(kv.seen.length, 0);
  const file = await fs.readFile(path.join(tmpDir, 'zevora-data', 'orders.json'), 'utf-8');
  assert.match(file, /ZEV-2026-4444/);
});

test('a failed Redis read never overwrites the stored orders with a new one-order list', async () => {
  process.env.KV_REST_API_URL = kvUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';
  await saveOrder(order('ZEV-2026-5001'));
  const before = kv.values.get('zevora:orders');

  kv.failGets = true;
  await assert.rejects(saveOrder(order('ZEV-2026-5002')));

  assert.equal(kv.values.get('zevora:orders'), before);
});

test('a failed Redis write rejects the save and never falls back to the local file', async () => {
  process.env.KV_REST_API_URL = kvUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';
  await saveOrder(order('ZEV-2026-6001'));
  const before = kv.values.get('zevora:orders');

  kv.failSets = true;
  await assert.rejects(saveOrder(order('ZEV-2026-6002')), /Unable to save right now/);

  assert.equal(kv.values.get('zevora:orders'), before);
  await assert.rejects(fs.access(path.join(tmpDir, 'zevora-data', 'orders.json')));
});

test('no Redis configured: the save resolves and goes to the local file', async () => {
  const saved = await saveOrder(order('ZEV-2026-7001'));

  assert.equal(saved.orderId, 'ZEV-2026-7001');
  assert.equal(upstash.seen.length + kv.seen.length, 0);
  const file = await fs.readFile(path.join(tmpDir, 'zevora-data', 'orders.json'), 'utf-8');
  assert.match(file, /ZEV-2026-7001/);
});

test('Stripe webhook answers 500 (not a 400 parse error) when the order store fails', async () => {
  const { createHmac } = await import('node:crypto');
  const { POST } = await import('../app/api/webhooks/stripe/route');
  process.env.KV_REST_API_URL = kvUrl;
  process.env.KV_REST_API_TOKEN = 'kv-token-test';
  await saveOrder(order('ZEV-2026-8001'));
  kv.failSets = true;
  const savedSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_only';
  const body = JSON.stringify({ type: 'checkout.session.completed', data: { object: { client_reference_id: 'ZEV-2026-8001' } } });
  const t = '1700000000';
  const sig = createHmac('sha256', 'whsec_test_only').update(`${t}.${body}`, 'utf8').digest('hex');
  try {
    const res = await POST(new Request('http://127.0.0.1/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${t},v1=${sig}` },
      body
    }));
    assert.equal(res.status, 500);
    const bad = await POST(new Request('http://127.0.0.1/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${t},v1=${createHmac('sha256', 'whsec_test_only').update(`${t}.{not json`, 'utf8').digest('hex')}` },
      body: '{not json'
    }));
    assert.equal(bad.status, 400);
  } finally {
    if (savedSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = savedSecret;
  }
});
