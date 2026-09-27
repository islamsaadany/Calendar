# Calendar — Room Booking

A single-file meeting-room booking app (`index.html`). No build step or server needed: open the file in a browser.

## Features

- **Week view** (Sun–Thu, 09:00–18:00, 30-min slots) with a current-time line; past slots are hatched and can't be booked.
- **Month view** showing time · duration · room · attendees for each meeting, with a "+N more" day list.
- **Room filter**: pick a room to see its free (green) and booked slots. With "All rooms" selected, hovering a slot lists the rooms that are free.
- **Person filter** to show only one person's meetings.
- **Booking dialog**: title, date, start, duration, organizer, and attendees. Rooms that are already booked or too small for the group are disabled, and you get a warning when an attendee is double-booked.
- Edit or cancel existing meetings by clicking them.
- Bookings are shared by everyone through `api/bookings.js`, a Vercel serverless function that stores them in Upstash Redis. The server rejects double-booking a room even if two people save at the same moment. Pages refresh every 30 seconds and when you switch back to the tab.
- If the API can't be reached (for example, when you open the file directly from disk), the app falls back to this browser's `localStorage` and shows a warning.

## Shared database setup (Vercel)

1. In your Vercel project, go to **Storage → Create Database → Upstash (Redis)**, use the free plan, and connect it to this project for all environments.
2. Redeploy. The integration adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables that the API reads. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work.

Meetings someone booked before sharing was turned on are uploaded automatically the first time they open the shared version in the same browser.

## Customising

Rooms, people, and working hours are defined at the top of the `<script>` block in `index.html` (`ROOMS`, `PEOPLE`, `DAY_START`, `DAY_END`, `STEP`). If you change rooms, update `ROOMS` in `api/bookings.js` too, because the server checks room IDs and capacity.
