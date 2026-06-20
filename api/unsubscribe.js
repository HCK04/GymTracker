// POST: remove a user's subscription (turn reminders off).
import { deleteUser } from './_kv.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { id } = req.body || {};
  if (id) await deleteUser(id);
  return res.status(200).json({ ok: true });
}
