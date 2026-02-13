# Fairytale - Project Management App

A beautiful, offline-capable project management application with Bible verse encouragement.

## Live Web App

**Access online:** https://project-tracker-c2cd2.web.app

### Install as PWA (Mobile)

1. Open the web app in Chrome (Android) or Safari (iOS)
2. Tap the menu button → "Add to Home Screen"
3. The app will install as a standalone app

### Install as PWA (Desktop)

1. Open https://project-tracker-c2cd2.web.app in Chrome/Edge
2. Click the install icon in the address bar
3. Or right-click → "Install Fairytale"

## Features

- 📱 **PWA/Offline Support** - Works without internet
- 🎨 **Beautiful UI** - Fairy tale themed design
- 📖 **Bible Verses** - Encouraging verses every 10 minutes
- 🔄 **Real-time Sync** - Firebase-powered backend
- 📊 **Project Management** - Tasks, teams, rewards
- 🏆 **Gamification** - XP, levels, streaks

## Download Desktop Apps

### Windows
Download the latest Windows installer from GitHub Releases.

### Linux
Download AppImage or .deb package from GitHub Releases.

### macOS
Download .dmg or .zip from GitHub Releases.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build Electron app
npm run electron:build:all
```

## Tech Stack

- React + Vite
- Redux Toolkit
- Firebase (Auth, Firestore, Hosting)
- Service Worker for offline support
- Electron for desktop

## License

MIT
