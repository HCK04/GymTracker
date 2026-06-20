// Thin wrapper over Vercel KV (Upstash Redis under the hood).
// Files starting with "_" are not exposed as routes but are bundled for import.
// Robust to both env-var namings: Vercel KV (KV_REST_API_*) and Upstash (UPSTASH_REDIS_REST_*).
import { createClient } from '@vercel/kv';

const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const USERS_SET = 'users';

export async function saveUser(id, data) {
  await kv.set(`user:${id}`, data);
  await kv.sadd(USERS_SET, id);
}

export async function getUser(id) {
  return kv.get(`user:${id}`);
}

export async function deleteUser(id) {
  await kv.del(`user:${id}`);
  await kv.srem(USERS_SET, id);
}

export async function allUserIds() {
  return (await kv.smembers(USERS_SET)) || [];
}

export { kv };
