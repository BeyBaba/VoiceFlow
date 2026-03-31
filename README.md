# VoiceFlow

The fastest voice dictation tool. Don't type, just speak.

## Features

- **Voice-to-Text**: Real-time speech recognition with AI-powered accuracy
- **Works Everywhere**: Windows desktop app + Chrome extension + web demo
- **4x Faster Than Typing**: Speak naturally and let VoiceFlow handle the rest
- **Auto-Paste**: Automatically pastes transcribed text into any application
- **AI Editing**: Smart text formatting and punctuation
- **Multi-Language**: Turkish and English interface (i18n)
- **PWA Support**: Installable as a Progressive Web App
- **Offline Detection**: Warns when internet connection is lost
- **Web Notifications**: Browser notification support for reminders
- **Privacy First**: KVKK/GDPR compliant, voice data is never stored

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Auth**: NextAuth.js
- **Database**: Prisma ORM
- **Desktop**: Electron + electron-builder
- **Animations**: Framer Motion
- **Deployment**: Vercel (web), GitHub Releases (desktop)
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/BeyBaba/VoiceFlow.git
cd VoiceFlow
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

## Download

- **Windows Desktop App**: [Download Latest](https://voice-flow-six.vercel.app/api/download)
- **Web Demo**: [Try Online](https://voice-flow-six.vercel.app/demo)
- **Website**: [voice-flow-six.vercel.app](https://voice-flow-six.vercel.app)

## Project Structure

```
src/
  app/          # Next.js app router pages
  components/   # React components
  i18n/         # Internationalization (tr.json, en.json)
  lib/          # Utility functions
public/
  icons/        # PWA icons
  manifest.json # PWA manifest
  sw.js         # Service worker
```

## License

All rights reserved.
