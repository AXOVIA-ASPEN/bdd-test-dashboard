# Silverline BDD Test Dashboard

[![CI/CD Pipeline](https://github.com/AXOVIA-ASPEN/bdd-test-dashboard/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/AXOVIA-ASPEN/bdd-test-dashboard/actions/workflows/ci-cd.yml)
[![Firebase Hosting](https://img.shields.io/badge/firebase-deployed-orange.svg)](https://silverline-bdd-test-dashboard.web.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)

Real-time BDD test results visualization for Silverline Software projects.

## 🚀 Features

- 📊 **Dashboard Overview** - Project cards with health indicators and trend charts
- 📈 **Trend Analysis** - 14-day pass rate visualization
- 🔍 **Run Detail** - Scenario-level breakdown with feature grouping
- 🎨 **Dark Mode** - Toggle between light and dark themes
- 🔄 **Real-time Updates** - Firestore listeners for live data
- ♿ **Accessible** - WCAG 2.1 compliant with keyboard navigation

## 🛠 Tech Stack

- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **State:** Zustand
- **Database:** Firebase Firestore
- **Hosting:** Firebase Hosting
- **Testing:** Vitest, Playwright

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- Firebase account

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npx playwright test
```

### Deployment

The app auto-deploys to Firebase Hosting on pushes to `main` via GitHub Actions.

Manual deploy:
```bash
npm run build
npx firebase deploy --only hosting
```

## 📄 License

© 2026 Silverline Software. All rights reserved.

## 🧑‍💻 Development

Built with ❤️ by ASPEN for Silverline Software.
