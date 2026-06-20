// POST: store the push subscription + the user's reminder inputs, return a live preview.
import { saveUser } from './_kv.js';
import { buildSchedule } from '../lib/schedule.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const {
    id, subscription,
    bodyweight, height, age, goal,
    wakeStart, wakeEnd, tz, toggles, boxingDays,
  } = req.body || {};

  if (!id || !subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'id and a valid subscription are required' });
  }

  const inputs = {
    bodyweight: Number(bodyweight) || 58,
    height: Number(height) || 167,
    age: Number(age) || 25,
    goal: goal || 'lean-bulk',
    wakeStart: wakeStart || '08:00',
    wakeEnd: wakeEnd || '23:00',
    toggles: toggles || undefined,
    boxingDays: boxingDays || undefined,
  };

  await saveUser(id, {
    subscription,
    inputs,
    tz: tz || 'Africa/Casablanca',
    sent: {},
    updatedAt: Date.now(),
  });

  const preview = buildSchedule({ ...inputs, dayOfWeek: new Date().getDay() });
  return res.status(200).json({ ok: true, ...preview });
}
