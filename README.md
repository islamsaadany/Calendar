# Calendar — Room Booking

A single-file meeting-room booking app (`index.html`). No build step or server needed: open the file in a browser.

## Features

- **Week view** (Sun–Thu, 09:00–18:00, 30-min slots) with a current-time line; past slots are hatched and can't be booked.
- **Month view** showing time · duration · room · attendees for each meeting, with a "+N more" day list.
- **Room filter**: pick a room to see its free (green) and booked slots. With "All rooms" selected, hovering a slot lists the rooms that are free.
- **Person filter** to show only one person's meetings.
- **Booking dialog**: title, date, start, duration, organizer, and attendees. Rooms that are already booked or too small for the group are disabled, and you get a warning when an attendee is double-booked.
- Edit or cancel existing meetings by clicking them.
- Data is saved in the browser's `localStorage` (key `room-booking-mvp-v1`) and filled with sample meetings on first load.

## Customising

Rooms, people, and working hours are defined at the top of the `<script>` block in `index.html` (`ROOMS`, `PEOPLE`, `DAY_START`, `DAY_END`, `STEP`).
