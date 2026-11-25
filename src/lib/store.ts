import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  isRecord,
  type ConciergeInquiryRecord,
  type NewsletterRecord,
  type OrderRecord,
  type PaymentStatus
} from '@/types/commerce';

type StoreKey = 'orders' | 'inquiries' | 'subscribers';

function getLocalDataDir(): string {
  // Vercel serverless filesystem under process.cwd() is read-only; use /tmp safely when on Vercel without Redis
  if (process.env.VERCEL === '1') {
    return path.join(os.tmpdir(), 'zevora-data');
  }
  return path.join(process.cwd(), '.data');
}

function getFilePath(key: StoreKey): string {
  return path.join(getLocalDataDir(), `${key}.json`);
}

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function readFromRedis<T>(key: StoreKey): Promise<T[] | null> {
  const cfg = getRedisConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/get/zevora:${key}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const payload: unknown = await res.json();
    if (!isRecord(payload) || typeof payload.result !== 'string') return [];
    const parsed: unknown = JSON.parse(payload.result);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return null;
  }
}

async function writeToRedis<T>(key: StoreKey, data: T[]): Promise<boolean> {
  const cfg = getRedisConfig();
  if (!cfg) return false;
  try {
    const res = await fetch(`${cfg.url}/set/zevora:${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function readCollection<T>(key: StoreKey): Promise<T[]> {
  const fromRedis = await readFromRedis<T>(key);
  if (fromRedis !== null) return fromRedis;

  try {
    const raw = await fs.readFile(getFilePath(key), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeCollection<T>(key: StoreKey, data: T[]): Promise<void> {
  const savedToRedis = await writeToRedis(key, data);
  if (savedToRedis) return;

  const dir = getLocalDataDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(getFilePath(key), JSON.stringify(data, null, 2), 'utf-8');
}

export async function saveOrder(order: OrderRecord): Promise<OrderRecord> {
  const orders = await readCollection<OrderRecord>('orders');
  orders.unshift(order);
  await writeCollection('orders', orders);
  return order;
}

export async function findOrderById(orderId: string): Promise<OrderRecord | null> {
  const normalized = orderId.trim().toUpperCase();
  const orders = await readCollection<OrderRecord>('orders');
  return orders.find((o) => o.orderId.toUpperCase() === normalized) ?? null;
}

export async function updateOrderPaymentStatus(
  orderId: string,
  status: PaymentStatus
): Promise<OrderRecord | null> {
  const normalized = orderId.trim().toUpperCase();
  const orders = await readCollection<OrderRecord>('orders');
  let updated: OrderRecord | null = null;
  const next = orders.map((order) => {
    if (order.orderId.toUpperCase() === normalized) {
      updated = {
        ...order,
        payment: {
          ...order.payment,
          status
        }
      };
      return updated;
    }
    return order;
  });
  if (updated) {
    await writeCollection('orders', next);
  }
  return updated;
}

export async function saveConciergeInquiry(
  record: ConciergeInquiryRecord
): Promise<ConciergeInquiryRecord> {
  const inquiries = await readCollection<ConciergeInquiryRecord>('inquiries');
  inquiries.unshift(record);
  await writeCollection('inquiries', inquiries);
  return record;
}

export async function saveNewsletterSubscriber(
  email: string
): Promise<{ alreadySubscribed: boolean; record: NewsletterRecord }> {
  const normalized = email.trim().toLowerCase();
  const list = await readCollection<NewsletterRecord>('subscribers');
  const existing = list.find((item) => item.email === normalized);
  if (existing) {
    return { alreadySubscribed: true, record: existing };
  }
  const record: NewsletterRecord = {
    email: normalized,
    subscribedAt: new Date().toISOString()
  };
  list.unshift(record);
  await writeCollection('subscribers', list);
  return { alreadySubscribed: false, record };
}
