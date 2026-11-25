// Run: node --test src/lib/email/orderMailer.test.ts (Node 22.18+ strips types natively).
// Uses only local sockets on 127.0.0.1: no real email is ever sent.
import { registerHooks } from 'node:module';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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
      return nextResolve(`${target}.ts`, context);
    }
  }
});

const { sendOrderEmails } = await import('./orderMailer');

const TEST_PASS = 'pw-should-never-appear-9f2c';

const order: OrderRecord = {
  orderId: 'ZEV-2026-TEST',
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
  payment: {
    provider: 'zevora_cod',
    method: 'cod',
    status: 'pending_cod',
    transactionId: 'T-1'
  }
};

let logged: string[] = [];
const realConsoleError = console.error;

function captureErrors(): void {
  logged = [];
  console.error = (...args: unknown[]): void => {
    logged.push(args.map(String).join(' '));
  };
}

function useSmtp(port: number): void {
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(port);
  process.env.SMTP_USER = 'shop@example.test';
  process.env.SMTP_PASS = TEST_PASS;
}

async function freeClosedPort(): Promise<number> {
  const server = net.createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (address === null || typeof address === 'string') throw new Error('no port');
  return address.port;
}

beforeEach(() => {
  for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'RESEND_API_KEY']) {
    delete process.env[key];
  }
  captureErrors();
});

after(() => {
  console.error = realConsoleError;
});

test('logs one secret-free line per failed SMTP send, keeps return shape', async () => {
  const port = await freeClosedPort();
  useSmtp(port);

  const result = await sendOrderEmails(order);

  assert.equal(result.transport, 'smtp');
  assert.equal(result.merchantNotified, false);
  assert.equal(result.customerNotified, false);
  assert.match(result.errorMessage ?? '', /ECONNREFUSED/);

  assert.equal(logged.length, 2);
  assert.match(
    logged[0],
    /^\[orderMailer\] email failed transport=smtp role=merchant code=ESOCKET message="connect ECONNREFUSED 127\.0\.0\.1:\d+"$/
  );
  assert.match(logged[1], /^\[orderMailer\] email failed transport=smtp role=customer code=ESOCKET /);
  for (const line of logged) {
    assert.ok(!line.includes(TEST_PASS), 'password leaked into log');
    assert.ok(!line.includes('\n'), 'log line must be one line');
  }
});

test('logs once when no transport is configured', async () => {
  const result = await sendOrderEmails(order);

  assert.equal(result.transport, 'unconfigured');
  assert.deepEqual(logged, [
    '[orderMailer] email skipped transport=unconfigured reason="SMTP_USER/SMTP_PASS and RESEND_API_KEY not set"'
  ]);
});

// Fake SMTP: greets after greetDelayMs, offers AUTH, rejects every login with 535.
async function withRejectingSmtp(greetDelayMs: number, body: () => Promise<void>): Promise<void> {
  const fake = net.createServer((socket) => {
    setTimeout(() => socket.write('220 fake.test ESMTP\r\n'), greetDelayMs);
    socket.on('data', (chunk: Buffer) => {
      const line = chunk.toString();
      if (/^(EHLO|HELO)/i.test(line)) socket.write('250-fake.test\r\n250 AUTH PLAIN LOGIN\r\n');
      else if (/^QUIT/i.test(line)) socket.end('221 bye\r\n');
      else socket.write('535 5.7.8 Error: authentication failed\r\n');
    });
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  const address = fake.address();
  if (address === null || typeof address === 'string') throw new Error('no port');
  useSmtp(address.port);
  try {
    await body();
  } finally {
    await new Promise<void>((resolve) => fake.close(() => resolve()));
  }
}

test('an SMTP auth rejection logs EAUTH without the password', async () => {
  await withRejectingSmtp(0, async () => {
    const result = await sendOrderEmails(order);
    assert.equal(result.merchantNotified, false);
    assert.equal(logged.length, 2);
    assert.match(logged.find((l) => l.includes('role=merchant')) ?? '', /code=EAUTH message=".*535/);
    for (const line of logged) assert.ok(!line.includes(TEST_PASS), 'password leaked into log');
  });
});

test('merchant and customer sends run in parallel', { timeout: 30_000 }, async () => {
  // Each send waits 5 s for the greeting: sequential would be 10 s and hit the 8 s deadline.
  await withRejectingSmtp(5_000, async () => {
    const started = Date.now();
    const result = await sendOrderEmails(order);
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 7_000, `took ${elapsed} ms`);
    assert.match(result.errorMessage ?? '', /535/);
    assert.equal(logged.length, 2);
    assert.ok(logged.every((l) => l.includes('code=EAUTH')));
  });
});

let silentServer: net.Server;
const openSockets = new Set<net.Socket>();

before(async () => {
  // Accepts connections and never sends the SMTP greeting: a hung server.
  silentServer = net.createServer((socket) => {
    openSockets.add(socket);
    socket.on('close', () => openSockets.delete(socket));
  });
  await new Promise<void>((resolve) => silentServer.listen(0, '127.0.0.1', resolve));
});

after(async () => {
  for (const socket of openSockets) socket.destroy();
  await new Promise<void>((resolve) => silentServer.close(() => resolve()));
});

// Last on purpose: the abandoned sends still log their own timeouts ~2 s after the deadline.
test('a hung SMTP server hits one 8 s deadline for the whole email phase', { timeout: 40_000 }, async () => {
  const address = silentServer.address();
  if (address === null || typeof address === 'string') throw new Error('no port');
  useSmtp(address.port);

  const started = Date.now();
  const result = await sendOrderEmails(order);
  const elapsed = Date.now() - started;

  assert.ok(elapsed >= 7_900 && elapsed < 9_000, `took ${elapsed} ms`);
  assert.equal(result.merchantNotified, false);
  assert.equal(result.customerNotified, false);
  assert.equal(result.errorMessage, 'Email timed out after 8s');
  assert.deepEqual(logged, [
    '[orderMailer] email failed transport=smtp role=merchant,customer code=DEADLINE message="Email timed out after 8s"'
  ]);
});
