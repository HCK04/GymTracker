// GET: compute targets + schedule from query params, no storage.
// Powers the live preview in the Reminders UI before/without subscribing.
import { buildSchedule } from '../lib/schedule.js';

export default function handler(req, res) {
  const q = req.query || {};
  let toggles, boxingDays;
  try { toggles = q.toggles ? JSON.parse(q.toggles) : undefined; } catch { toggles = undefined; }
  try { boxingDays = q.boxingDays ? String(q.boxingDays).split(',').map(Number) : undefined; } catch { boxingDays = undefined; }

  const preview = buildSchedule({
    bodyweight: Number(q.bw) || 58,
    height: Number(q.height) || 167,
    age: Number(q.age) || 25,
    goal: q.goal || 'lean-bulk',
    wakeStart: q.wakeStart || '08:00',
    wakeEnd: q.wakeEnd || '23:00',
    toggles,
    boxingDays,
    dayOfWeek: q.dow != null ? Number(q.dow) : new Date().getDay(),
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(preview);
}
