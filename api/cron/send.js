// Triggered every ~15 min by Upstash QStash (Hobby) or Vercel Cron (Pro).
// Sends any reminder whose scheduled local time falls in the window since the last run.
import webpush from 'web-push';
import { allUserIds, getUser, saveUser, deleteUser } from '../_kv.js';
import { buildSchedule } from '../../lib/schedule.js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:notifications@example.com',
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE,
);

const WINDOW = 15; // minutes — match the cron cadence

const hm = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
};

// Current local time in a given IANA timezone -> minutes-of-day, day-of-week, date key.
function localNow(tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    hour: '2-digit', minute: '2-digit', weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const minutes = (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10);
  const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  return { minutes, dow, dateKey: `${p.year}-${p.month}-${p.day}` };
}

export default async function handler(req, res) {
  // Auth: shared secret (Authorization: Bearer <CRON_SECRET> or ?key=)
  const provided = (req.headers.authorization || '').replace('Bearer ', '') || req.query.key;
  if (process.env.CRON_SECRET && provided !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const ids = await allUserIds();
  let sent = 0;

  for (const id of ids) {
    const user = await getUser(id);
    if (!user || !user.subscription) continue;

    const tz = user.tz || 'Africa/Casablanca';
    const { minutes, dow, dateKey } = localNow(tz);
    const { entries } = buildSchedule({ ...user.inputs, dayOfWeek: dow });

    // Reset the per-day dedup ledger at the start of each local day.
    if (!user.sent || user.sent.date !== dateKey) user.sent = { date: dateKey, keys: [] };

    let changed = false;
    let dropped = false;

    for (const e of entries) {
      const t = hm(e.hhmm);
      const key = `${e.hhmm}:${e.type}`;
      const due = t > minutes - WINDOW && t <= minutes;
      if (!due || user.sent.keys.includes(key)) continue;

      try {
        await webpush.sendNotification(
          user.subscription,
          JSON.stringify({ title: e.title, body: e.body, tag: e.type, view: e.view }),
        );
        user.sent.keys.push(key);
        changed = true;
        sent++;
      } catch (err) {
        // Subscription gone -> clean it up and stop processing this user.
        if (err.statusCode === 410 || err.statusCode === 404) {
          await deleteUser(id);
          dropped = true;
          break;
        }
      }
    }

    if (changed && !dropped) await saveUser(id, user);
  }

  return res.status(200).json({ ok: true, sent });
}
