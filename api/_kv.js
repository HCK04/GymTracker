// Thin wrapper over Vercel KV (Upstash Redis under the hood).
// Files starting with "_" are not exposed as routes but are bundled for import.
import { kv } from '@vercel/kv';

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
