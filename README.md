# Pachi EV Analyzer

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

Pachi EV Analyzer is an open-source analytics tool for expected value calculation, bankroll management, and performance tracking for pachinko and pachislot players.

The project focuses on statistics, risk management, and data visualization rather than gambling promotion.

## Project Status

This project is currently in early development as a personal open-source project.

Version: 0.2.0

## Live Demo

Demo URL:

https://pachi-ev-analyzer.vercel.app

## Screenshots

The app includes dashboard KPIs, expected value calculation, bankroll tracking, import/export tools, and analytics charts.

| Dashboard | Expected Value Calculator | Analytics Graphs |
| --- | --- | --- |
| ![Dashboard screen](docs/screenshots/dashboard.svg) | ![Expected value calculator screen](docs/screenshots/expected-value.svg) | ![Analytics graphs screen](docs/screenshots/analytics.svg) |

## Features

- Expected Value Calculator
- Bankroll Management
- Dashboard Analytics
- Monthly Profit Analysis
- Machine Performance Analysis
- Store Performance Analysis
- Risk Monitoring
- JSON Backup Export
- JSON Import
- CSV Export
- PWA Support
- Dark Mode

## Why This Project Exists

The goal of this project is to provide a simple and transparent way to analyze expected value, historical performance, and bankroll risk.

Most existing tools focus only on raw calculations.

Pachi EV Analyzer combines calculation, analytics, and visualization in a single dashboard.

## Disclaimer

This project does not encourage gambling.

Its purpose is to help users understand expected value, statistical variance, bankroll risk, and historical performance through data analysis.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Recharts
- LocalStorage

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Data Storage

The MVP stores data in LocalStorage.

```text
pachi-ev-analyzer-records-v1
pachi-ev-analyzer-settings-v1
```

Use the JSON export button before clearing browser data or moving to another device.

## Privacy

This app stores data only in your browser using LocalStorage.

No server-side database is used in the current version.

## Screenshot Workflow

The app includes a `サンプルデータ読み込み` button for README and release screenshots.

1. Run the local app.
2. Click `サンプルデータ読み込み`.
3. Capture the dashboard, expected value calculator, and analytics graph sections.
4. Save the images in `docs/screenshots/`.
5. Replace the existing screenshot files while keeping these names:
   - `dashboard.svg`
   - `expected-value.svg`
   - `analytics.svg`

PNG files can also be used. If you switch to PNG, update the image paths in this README.

## Roadmap

### Version 0.2.0

Completed:

- PWA Support
- Dark Mode
- CSV Export
- JSON Import
- Dashboard Analytics
- Bankroll Management

### Version 0.3

- Advanced Analytics
- Yearly Statistics
- Performance Ranking

### Version 0.4

- Risk Simulation
- Historical Trend Analysis

## Release Notes

### v0.2.0

- Added PWA support with installability metadata, app icons, and a service worker.
- Added light/dark theme support with LocalStorage persistence.
- Added CSV export for profit/loss records.
- Added JSON import for restoring backed-up records.
- Improved dashboard analytics for monthly, machine, store, and weekday performance.
- Improved bankroll management and risk visibility.

## Contributing

Issues and suggestions are welcome.

This project is still in early development, so feedback on usability, analytics, and documentation is appreciated.

## License

MIT License
