// Shared booking store: a Vercel serverless function backed by Upstash Redis (REST API).
// Bookings are kept in one Redis hash: field = booking id, value = booking JSON.
const ROOMS = { nile: 12, giza: 8, luxor: 6, aswan: 4 }; // keep in sync with ROOMS in index.html
const KEY = 'bookings';
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || `Redis HTTP ${r.status}`);
  return j.result;
}

async function all() {
  const flat = (await redis('HGETALL', KEY)) || [];
  const out = [];
  for (let i = 1; i < flat.length; i += 2) {
    try { out.push(JSON.parse(flat[i])); } catch (e) {}
  }
  return out;
}

const overlap = (a, b) => a.date === b.date && a.start < b.start + b.dur && b.start < a.start + a.dur;

function clean(b) {
  if (!b || typeof b !== 'object') return null;
  const int = v => (Number.isInteger(v) ? v : NaN);
  const out = {
    id: String(b.id || ''),
    title: String(b.title || 'Meeting').slice(0, 200),
    date: String(b.date || ''),
    start: int(b.start),
    dur: int(b.dur),
    room: String(b.room || ''),
    organizer: String(b.organizer || ''),
    attendees: Array.isArray(b.attendees) ? b.attendees.map(String) : null
  };
  if (!/^b[a-z0-9]{1,40}$/.test(out.id)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.date)) return null;
  if (!(out.start >= 0 && out.dur > 0 && out.start + out.dur <= 24 * 60)) return null;
  if (!(out.room in ROOMS)) return null;
  if (!/^p\d{1,4}$/.test(out.organizer)) return null;
  if (!out.attendees || out.attendees.length > 100 || !out.attendees.every(a => /^p\d{1,4}$/.test(a))) return null;
  out.attendees = [...new Set(out.attendees)].filter(a => a !== out.organizer);
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: 'Shared database is not configured' });
  try {
    if (req.method === 'GET') return res.status(200).json({ bookings: await all() });

    if (req.method === 'POST') {
      const b = clean(req.body);
      if (!b) return res.status(400).json({ error: 'Invalid booking' });
      const list = await all();
      const clash = list.find(x => x.id !== b.id && x.room === b.room && overlap(x, b));
      if (clash) {
        return res.status(409).json({
          error: `That room was just booked by someone else (“${clash.title}”). Pick another room or time.`,
          bookings: list
        });
      }
      const people = new Set([b.organizer, ...b.attendees]).size;
      if (people > ROOMS[b.room]) return res.status(400).json({ error: `Room seats ${ROOMS[b.room]} — you have ${people} people.` });
      await redis('HSET', KEY, b.id, JSON.stringify(b));
      return res.status(200).json({ bookings: await all() });
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '');
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await redis('HDEL', KEY, id);
      return res.status(200).json({ bookings: await all() });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error — please try again' });
  }
};
