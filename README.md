# Pachi EV Analyzer

Pachi EV Analyzer is an OSS web app for learning-focused expected value, revenue, and bankroll analysis for pachinko and pachislot.

This project does not recommend gambling. It is intended for probability, statistics, bankroll management, and personal record analysis.

## Features

- Expected value calculator with border difference and rotation-rate evaluation
- Revenue record registration using LocalStorage
- KPI summary: investment, recovery, profit, win rate, averages, and bankroll balance
- Monthly, weekday, machine, hall, and investment analysis
- Bankroll settings and loss-limit warnings
- JSON backup export

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Recharts
- LocalStorage

## LocalStorage Keys

```text
pachi-ev-analyzer-records-v1
pachi-ev-analyzer-settings-v1
```

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap

### Phase 1 MVP

- EV calculation
- Revenue record registration
- Revenue list
- KPI display
- LocalStorage persistence

### Phase 2 Analytics

- Monthly revenue chart
- Machine analysis
- Hall analysis
- Weekday analysis
- Investment analysis

### Phase 3 Risk Management

- Bankroll settings
- Loss warnings
- Balance trend chart
- Drawdown analysis

### Phase 4 EV Simulator

- EV simulator
- Convergence chart
- Variance analysis

### Phase 5 OSS Release

- Public GitHub repository: `pachi-ev-analyzer`
- Vercel demo: `https://pachi-ev-analyzer.vercel.app`
- Screenshots and license

## License

MIT
