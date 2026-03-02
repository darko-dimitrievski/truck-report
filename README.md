# Truck Breakdown Report — PWA

A Progressive Web App for submitting truck breakdown reports from the field. Reports are emailed with photos attached.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and add your Gmail App Password
npm start
```

Open `http://localhost:3000`

## Environment Variables

| Variable | Description |
|---|---|
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your login password) |
| `PORT` | Port to run server on (default: 3000) |

## Getting a Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate a new app password for "Mail"
4. Paste it into your `.env` file

## Project Structure

```
truck-report/
├── public/
│   ├── index.html      # Main page
│   ├── style.css       # Styles
│   ├── script.js       # Client JS
│   ├── manifest.json   # PWA manifest
│   ├── sw.js           # Service Worker
│   └── icons/          # PWA icons (192x192, 512x512)
├── server.js           # Express + Nodemailer backend
├── package.json
└── .env
```

## PWA Installation

When visiting the app in Chrome/Edge/Safari on mobile, users will be prompted to **Add to Home Screen**. The app works offline (form UI available, submission requires connection).

## Email Behavior

- Always sends to: `roadassist@gavrofreight.com`
- Optional CC to `dispatch@gavrofreight.com` and/or `shop@@gavrofreight.com` via checkboxes
- Subject: `Breakdown Report — Truck [NUMBER] | [DATE]`
- Photos attached directly to email

## Icons

Place your own 192×192 and 512×512 PNG icons in `public/icons/` named `icon-192.png` and `icon-512.png`.
