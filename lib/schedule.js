// Builds the daily reminder schedule from the user's inputs.
// Returns { targets, entries } where each entry is { hhmm, type, title, body, view }.
// Single source of truth — the cron sender and the UI preview both call this.

import { computeTargets } from './targets.js';

const DEFAULTS = {
  wakeStart: '08:00',
  wakeEnd: '23:00',
  goal: 'lean-bulk',
  boxingDays: [2, 5], // 0=Sun … 2=Tue, 5=Fri
  toggles: { water: true, eat: true, log: true, boxing: true, wrist: true },
};

const hm = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
};
const fmt = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
};

export function buildSchedule(opts = {}) {
  const o = {
    ...DEFAULTS,
    ...opts,
    toggles: { ...DEFAULTS.toggles, ...(opts.toggles || {}) },
  };
  const boxingDays = opts.boxingDays && opts.boxingDays.length ? opts.boxingDays : DEFAULTS.boxingDays;
  const boxingToday = opts.dayOfWeek != null && boxingDays.includes(Number(opts.dayOfWeek));

  const targets = computeTargets({ ...o, trainingDay: true });
  const start = hm(o.wakeStart);
  const end = hm(o.wakeEnd);
  const span = Math.max(end - start, 60);
  const entries = [];

  // --- Eat: 5 protein-anchored eating occasions across the waking window ---
  if (o.toggles.eat) {
    const meals = [
      { f: 0.00, title: '🍳 Breakfast', p: 30 },
      { f: 0.22, title: '🥪 Snack', p: 20 },
      { f: 0.42, title: '🍽️ Lunch', p: 30 },
      { f: 0.62, title: '🥤 Pre/post-workout', p: 25 },
      { f: 0.82, title: '🍗 Dinner', p: 30 },
    ];
    for (const m of meals) {
      entries.push({
        hhmm: fmt(Math.round(start + m.f * span)),
        type: 'eat',
        title: m.title,
        body: `~${m.p}g protein — hit ${targets.protein}g & ${targets.kcal} kcal today`,
        view: 'nutrition',
      });
    }
  }

  // --- Water: 8 evenly spaced pings ---
  if (o.toggles.water) {
    const n = 8;
    const glass = Math.round(targets.waterMl / n / 50) * 50;
    for (let i = 0; i < n; i++) {
      entries.push({
        hhmm: fmt(Math.round(start + (i + 0.5) * span / n)),
        type: 'water',
        title: '💧 Drink water',
        body: `~${glass} ml — target ${targets.waterL} L today`,
        view: 'home',
      });
    }
  }

  // --- Boxing day morning cue ---
  if (o.toggles.boxing && boxingToday) {
    entries.push({
      hhmm: fmt(start + 30),
      type: 'boxing',
      title: '🥊 Boxing today',
      body: 'Wraps on · 50% power, 100% wrist alignment · film one round',
      view: 'workout',
    });
  }

  // --- Evening log nudge ---
  if (o.toggles.log) {
    entries.push({
      hhmm: fmt(end - 90),
      type: 'log',
      title: '📝 Log today',
      body: 'Workout sets + food before bed',
      view: 'progress',
    });
  }

  // --- Wrist care after a boxing session ---
  if (o.toggles.wrist && boxingToday) {
    entries.push({
      hhmm: fmt(end - 60),
      type: 'wrist',
      title: '🩹 Wrist care',
      body: 'Ice + stretch the right wrist after today’s session',
      view: 'home',
    });
  }

  entries.sort((a, b) => hm(a.hhmm) - hm(b.hhmm));
  return { targets, entries };
}
