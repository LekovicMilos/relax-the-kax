# Relax the Kax

Chrome new-tab extension that combines a calming background photo with your daily Jira tickets and Google Calendar events on a single, focused page.

## Features
- **New tab dashboard** — overrides the default Chrome new tab.
- **Jira integration** — shows tickets assigned to you, filtered by selectable status (In Progress, To Do, In Review, Code Review, Blocked, Done Today). Credentials are encrypted with AES-GCM (Web Crypto API) using a per-profile salt before being saved to `chrome.storage.sync`.
- **Google Calendar integration** — OAuth via `chrome.identity`, lists today's upcoming events with location and video-call link detection. Auto-refreshes every 5 minutes.
- **Picsum backgrounds** — random daily photo cached for the day, with a manual refresh button.
- **Personal greeting** — optional display name stored in sync storage.

## Tech stack
React 18, TypeScript, TailwindCSS 3, Webpack 5, Manifest V3.

## Build & install
```bash
npm install
npm run build      # outputs dist/
```
Then in Chrome: `chrome://extensions` → enable Developer mode → **Load unpacked** → select the `dist/` folder.

For development with file watching:
```bash
npm run watch
```

## Configuration
After installing, open a new tab:
1. Enter your Jira domain (`company.atlassian.net`), email, and API token. Get a token at https://id.atlassian.com/manage-profile/security/api-tokens.
2. Pick which ticket statuses to display.
3. Optionally connect Google Calendar from the Settings panel.

## Author
Milos Lekovic — MIT licensed.
