"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ChevronDown,
  Download,
  GitFork,
  HelpCircle,
  LineChart,
  PiggyBank,
  Plus,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Trophy,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STORAGE_KEY = "pachi-ev-analyzer-records-v1";
const SETTINGS_KEY = "pachi-ev-analyzer-settings-v1";
const GITHUB_URL = "https://github.com/pachi-ev-analyzer/pachi-ev-analyzer";

type RecordType = "玉" | "枚";
type Tone = "neutral" | "good" | "bad";
type EvRank = "S" | "A" | "B" | "C" | "D";

type PachiRecord = {
  id: string;
  date: string;
  machine: string;
  hall: string;
  investment: number;
  recovery: number;
  unitDiff: number;
  type: RecordType;
  memo: string;
};

type BankrollSettings = {
  bankroll: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
};

type EvInput = {
  machineName: string;
  jackpotDenominator: number;
  spinsPerK: number;
  borderSpins: number;
  averagePayout: number;
  exchangeRate: number;
};

const initialEv: EvInput = {
  machineName: "",
  jackpotDenominator: 399,
  spinsPerK: 18,
  borderSpins: 17,
  averagePayout: 4500,
  exchangeRate: 3.57,
};

const initialSettings: BankrollSettings = {
  bankroll: 100000,
  dailyLimit: 30000,
  weeklyLimit: 80000,
  monthlyLimit: 150000,
};

const demoRecords: PachiRecord[] = [
  ["2026-01-08", "エヴァ未来", "駅前ホール", 22000, 56000, 7200, "玉", "ボーダー超え"],
  ["2026-01-19", "北斗スマスロ", "中央ホール", 38000, 11000, -900, "枚", "早めに撤退"],
  ["2026-02-04", "海物語ブラック", "郊外ホール", 14000, 33500, 4800, "玉", "良釘"],
  ["2026-02-22", "ジャグラーEX", "駅前ホール", 21000, 15000, -120, "枚", "短時間"],
  ["2026-03-03", "エヴァ未来", "中央ホール", 31000, 76000, 11200, "玉", "大きく上振れ"],
  ["2026-03-18", "からくりサーカス", "郊外ホール", 47000, 18000, -700, "枚", "高投資"],
  ["2026-04-06", "海物語ブラック", "駅前ホール", 17000, 43000, 6500, "玉", "安定"],
  ["2026-04-27", "北斗スマスロ", "中央ホール", 52000, 0, -1200, "枚", "下振れ"],
  ["2026-05-10", "ジャグラーEX", "郊外ホール", 12000, 24500, 260, "枚", "低投資"],
  ["2026-05-28", "エヴァ未来", "駅前ホール", 36000, 0, -9000, "玉", "大きな下振れ"],
  ["2026-06-01", "海物語ブラック", "駅前ホール", 18000, 39500, 5200, "玉", "回転率良好"],
  ["2026-06-05", "エヴァ未来", "中央ホール", 24000, 51000, 6800, "玉", "ボーダー超え"],
].map(([date, machine, hall, investment, recovery, unitDiff, type, memo], index) => ({
  id: `demo-${index + 1}`,
  date: String(date),
  machine: String(machine),
  hall: String(hall),
  investment: Number(investment),
  recovery: Number(recovery),
  unitDiff: Number(unitDiff),
  type: type as RecordType,
  memo: String(memo),
}));

const initialSampleRecords = demoRecords.slice(-6);
const number = new Intl.NumberFormat("ja-JP");
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

const formatYen = (value: number) => {
  const sign = value < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(value)).toLocaleString("ja-JP")}円`;
};

const formatSignedYen = (value: number) => {
  if (value > 0) return `+${formatYen(value)}`;
  return formatYen(value);
};

function formatAxisYen(value: number) {
  if (Math.abs(value) >= 10000) return `${Math.round(value / 10000)}万円`;
  return formatYen(value);
}

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeNumericInput(value: string) {
  if (value === "") return 0;
  if (value.includes(".")) return Number(value.replace(/^0+(?=\d)/, ""));
  return Number(value.replace(/^0+(?=\d)/, ""));
}

function getWeekKey(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const bucket = key(item);
    acc[bucket] = acc[bucket] ?? [];
    acc[bucket].push(item);
    return acc;
  }, {});
}

function profitOf(record: PachiRecord) {
  return record.recovery - record.investment;
}

function winRate(records: PachiRecord[]) {
  if (records.length === 0) return 0;
  return (records.filter((record) => profitOf(record) > 0).length / records.length) * 100;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxLosingStreak(records: PachiRecord[]) {
  let current = 0;
  let max = 0;
  [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((record) => {
      if (profitOf(record) < 0) {
        current += 1;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    });
  return max;
}

function toneClass(tone: Tone) {
  if (tone === "good") return "text-[var(--teal-dark)]";
  if (tone === "bad") return "text-[var(--rose)]";
  return "";
}

function valueTone(value: number): Tone {
  if (value > 0) return "good";
  if (value < 0) return "bad";
  return "neutral";
}

function evRank(evPer1k: number): EvRank {
  if (evPer1k >= 3000) return "S";
  if (evPer1k >= 1500) return "A";
  if (evPer1k >= 500) return "B";
  if (evPer1k >= 0) return "C";
  return "D";
}

function chartTooltipFormatter(value: unknown) {
  return [formatYen(Number(value)), "収支"] as [string, string];
}

function balanceTooltipFormatter(value: unknown) {
  return [formatYen(Number(value)), "残高"] as [string, string];
}

function DashboardCard({
  label,
  value,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: Tone;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[var(--muted)]">
        <Icon size={18} aria-hidden />
        <p className="truncate text-xs font-black">{label}</p>
      </div>
      <p className={`mt-3 break-words text-2xl font-black leading-tight sm:text-3xl ${toneClass(tone)}`}>
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel)] p-3 shadow-sm">
      <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
      <p className={`mt-2 break-words text-base font-black leading-snug sm:text-lg ${toneClass(tone)}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryStrip({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: Tone }>;
}) {
  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-md bg-[#f5f7f4] p-2">
          <p className="truncate text-xs font-bold text-[var(--muted)]">{item.label}</p>
          <p className={`mt-1 break-words text-sm font-black ${toneClass(item.tone ?? "neutral")}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChartFallback() {
  return (
    <div className="grid h-full min-h-48 place-items-center rounded-md border border-dashed border-[var(--line)] bg-[#f8faf7] text-sm font-bold text-[var(--muted)]">
      データ待機中
    </div>
  );
}

function ChartPanel({
  title,
  summary,
  children,
}: {
  title: string;
  summary: Array<{ label: string; value: string; tone?: Tone }>;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <h3 className="mb-3 text-base font-black">{title}</h3>
      <SummaryStrip items={summary} />
      <div className="h-72 min-w-0 sm:h-80">{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-bold text-[#24302c]">
      {label}
      {children}
      {help && <span className="text-xs font-bold leading-5 text-[var(--muted)]">{help}</span>}
    </label>
  );
}

function inputClass() {
  return "min-h-12 w-full min-w-0 rounded-md border border-[var(--line)] bg-white px-3 text-base outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[rgba(15,118,110,0.18)]";
}

export default function Home() {
  const [records, setRecords] = useState<PachiRecord[]>([]);
  const [settings, setSettings] = useState<BankrollSettings>(initialSettings);
  const [ev, setEv] = useState<EvInput>(initialEv);
  const [ready, setReady] = useState(false);
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    const storedRecords = window.localStorage.getItem(STORAGE_KEY);
    const storedSettings = window.localStorage.getItem(SETTINGS_KEY);

    if (storedRecords) {
      setRecords(JSON.parse(storedRecords));
    } else {
      setRecords(initialSampleRecords);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSampleRecords));
    }

    if (storedSettings) {
      setSettings({ ...initialSettings, ...JSON.parse(storedSettings) });
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, ready]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, ready]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  const totals = useMemo(() => {
    const investment = records.reduce((sum, record) => sum + record.investment, 0);
    const recovery = records.reduce((sum, record) => sum + record.recovery, 0);
    const profit = recovery - investment;
    const balance = settings.bankroll + profit;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyProfit = records
      .filter((record) => record.date.slice(0, 7) === currentMonth)
      .reduce((sum, record) => sum + profitOf(record), 0);

    return {
      investment,
      recovery,
      profit,
      balance,
      monthlyProfit,
      winRate: winRate(records),
      maxLosingStreak: maxLosingStreak(records),
      averageInvestment: average(records.map((record) => record.investment)),
      averageRecovery: average(records.map((record) => record.recovery)),
      maxInvestment: Math.max(0, ...records.map((record) => record.investment)),
      maxRecovery: Math.max(0, ...records.map((record) => record.recovery)),
    };
  }, [records, settings.bankroll]);

  const evResult = useMemo(() => {
    const border = Number(ev.borderSpins);
    const actual = Number(ev.spinsPerK);
    const payout = Number(ev.averagePayout);
    const rotationDiff = actual - border;
    const rotationDiffRate = border > 0 ? (rotationDiff / border) * 100 : 0;
    const evPer1k = border > 0 ? Math.round((rotationDiff / border) * payout * ev.exchangeRate) : 0;
    const evPer1000 = actual > 0 ? Math.round(evPer1k * (1000 / actual)) : 0;
    const rank = evRank(evPer1k);
    const comment =
      actual <= border - 1
        ? "ボーダー未満。長期的には不利。"
        : actual > border && actual < border + 2
          ? "ボーダー超え。ただし優位性は小さい。"
          : actual >= border + 2
            ? "ボーダーを大きく上回る。期待値は高め。"
            : "ボーダー付近。優位性は限定的。";

    return { rotationDiff, rotationDiffRate, evPer1k, evPer1000, rank, comment };
  }, [ev]);

  const monthlyData = useMemo(() => {
    const grouped = groupBy(records, (record) => record.date.slice(0, 7));
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, rows]) => ({
        month,
        net: rows.reduce((sum, record) => sum + profitOf(record), 0),
      }));
  }, [records]);

  const chartSummary = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const current = monthlyData.find((item) => item.month === currentMonth)?.net ?? 0;
    const best = monthlyData.reduce((max, item) => Math.max(max, item.net), 0);
    const worst = monthlyData.reduce((min, item) => Math.min(min, item.net), 0);
    return [
      { label: "今月収支", value: formatSignedYen(current), tone: valueTone(current) },
      { label: "最高月", value: formatSignedYen(best), tone: valueTone(best) },
      { label: "最低月", value: formatSignedYen(worst), tone: valueTone(worst) },
    ];
  }, [monthlyData]);

  const machineData = useMemo(() => {
    return Object.entries(groupBy(records, (record) => record.machine || "未入力"))
      .map(([name, rows]) => ({
        name,
        total: rows.reduce((sum, record) => sum + profitOf(record), 0),
        winRate: winRate(rows),
        average: average(rows.map(profitOf)),
      }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  const hallData = useMemo(() => {
    return Object.entries(groupBy(records, (record) => record.hall || "未入力"))
      .map(([name, rows]) => ({
        name,
        total: rows.reduce((sum, record) => sum + profitOf(record), 0),
        winRate: winRate(rows),
      }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  const weekdayData = useMemo(() => {
    return weekdays.map((day, index) => {
      const rows = records.filter((record) => new Date(`${record.date}T00:00:00`).getDay() === index);
      return {
        day,
        total: rows.reduce((sum, record) => sum + profitOf(record), 0),
      };
    });
  }, [records]);

  const balanceData = useMemo(() => {
    let balance = settings.bankroll;
    return [...records]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((record) => {
        balance += profitOf(record);
        return {
          date: record.date.slice(5),
          balance,
        };
      });
  }, [records, settings.bankroll]);

  const balanceSummary = useMemo(() => {
    const balances = balanceData.map((item) => item.balance);
    const current = balances.at(-1) ?? settings.bankroll;
    const high = Math.max(settings.bankroll, ...balances);
    const low = Math.min(settings.bankroll, ...balances);
    return [
      { label: "現在残高", value: formatYen(current), tone: valueTone(current - settings.bankroll) },
      { label: "最高残高", value: formatYen(high), tone: "good" as Tone },
      { label: "最低残高", value: formatYen(low), tone: valueTone(low - settings.bankroll) },
    ];
  }, [balanceData, settings.bankroll]);

  const machineSummary = useMemo(() => {
    const best = machineData[0];
    const worst = machineData.reduce((min, item) => (item.total < min.total ? item : min), machineData[0]);
    return [
      { label: "機種数", value: `${machineData.length}機種` },
      { label: "最高機種", value: best ? formatSignedYen(best.total) : "0円", tone: best ? valueTone(best.total) : "neutral" },
      { label: "最低機種", value: worst ? formatSignedYen(worst.total) : "0円", tone: worst ? valueTone(worst.total) : "neutral" },
    ];
  }, [machineData]);

  const hallSummary = useMemo(() => {
    const best = hallData[0];
    const worst = hallData.reduce((min, item) => (item.total < min.total ? item : min), hallData[0]);
    return [
      { label: "店舗数", value: `${hallData.length}店舗` },
      { label: "最高店舗", value: best ? formatSignedYen(best.total) : "0円", tone: best ? valueTone(best.total) : "neutral" },
      { label: "最低店舗", value: worst ? formatSignedYen(worst.total) : "0円", tone: worst ? valueTone(worst.total) : "neutral" },
    ];
  }, [hallData]);

  const weekdaySummary = useMemo(() => {
    const best = weekdayData.reduce((max, item) => (item.total > max.total ? item : max), weekdayData[0]);
    const worst = weekdayData.reduce((min, item) => (item.total < min.total ? item : min), weekdayData[0]);
    return [
      { label: "最高曜日", value: best ? `${best.day} ${formatSignedYen(best.total)}` : "なし", tone: best ? valueTone(best.total) : "neutral" },
      { label: "最低曜日", value: worst ? `${worst.day} ${formatSignedYen(worst.total)}` : "なし", tone: worst ? valueTone(worst.total) : "neutral" },
      { label: "記録件数", value: `${records.length}件` },
    ];
  }, [records.length, weekdayData]);

  const warnings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);
    const thisWeek = getWeekKey(today);
    const dailyLoss = records
      .filter((record) => record.date === today)
      .reduce((sum, record) => sum + Math.max(0, -profitOf(record)), 0);
    const weeklyLoss = records
      .filter((record) => getWeekKey(record.date) === thisWeek)
      .reduce((sum, record) => sum + Math.max(0, -profitOf(record)), 0);
    const monthlyLoss = records
      .filter((record) => record.date.slice(0, 7) === thisMonth)
      .reduce((sum, record) => sum + Math.max(0, -profitOf(record)), 0);
    return [
      dailyLoss > settings.dailyLimit ? `本日の損失が上限 ${formatYen(settings.dailyLimit)} を超過` : "",
      weeklyLoss > settings.weeklyLimit ? `今週の損失が上限 ${formatYen(settings.weeklyLimit)} を超過` : "",
      monthlyLoss > settings.monthlyLimit ? `今月の損失が上限 ${formatYen(settings.monthlyLimit)} を超過` : "",
      totals.balance < 0 ? "残資金がマイナスです" : "",
    ].filter(Boolean);
  }, [records, settings, totals.balance]);

  function updateEvNumber(key: keyof Omit<EvInput, "machineName">, value: string) {
    setEv((current) => ({ ...current, [key]: sanitizeNumericInput(value) }));
  }

  function addRecord(formData: FormData) {
    const record: PachiRecord = {
      id: crypto.randomUUID(),
      date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
      machine: String(formData.get("machine") || ""),
      hall: String(formData.get("hall") || ""),
      investment: toNumber(formData.get("investment")),
      recovery: toNumber(formData.get("recovery")),
      unitDiff: toNumber(formData.get("unitDiff")),
      type: String(formData.get("type") || "玉") as RecordType,
      memo: String(formData.get("memo") || ""),
    };
    setRecords((current) => [record, ...current]);
    setIsRecordFormOpen(false);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ records, settings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pachi-ev-analyzer-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function loadDemoRecords() {
    setRecords(demoRecords);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoRecords));
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5 overflow-x-hidden px-3 py-4 pb-12 sm:gap-6 sm:px-6 lg:px-8">
      <header className="grid gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--teal-dark)]">学習・分析・リスク管理</p>
            <h1 className="text-2xl font-black tracking-normal sm:text-4xl">Pachi EV Analyzer</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadDemoRecords}
              className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-black shadow-sm"
            >
              <BarChart3 size={18} aria-hidden />
              サンプルデータ読み込み
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-black shadow-sm"
            >
              <Download size={18} aria-hidden />
              JSON
            </button>
          </div>
        </div>

        <section className="rounded-md border border-[var(--line)] bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setIsAboutOpen((current) => !current)}
            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left font-black"
            aria-expanded={isAboutOpen}
          >
            <span className="inline-flex items-center gap-2">
              <HelpCircle size={18} aria-hidden />
              このアプリについて
            </span>
            <ChevronDown size={18} aria-hidden className={`transition ${isAboutOpen ? "rotate-180" : ""}`} />
          </button>
          {isAboutOpen && (
            <div className="grid gap-2 border-t border-[var(--line)] px-4 py-3 text-sm font-bold leading-6 text-[var(--muted)]">
              <p>Pachi EV Analyzer は、期待値計算、収支分析、資金管理を行うためのツールです。</p>
              <p>ギャンブルを推奨するものではありません。確率・統計・資金管理の学習を目的とします。</p>
            </div>
          )}
        </section>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardCard icon={PiggyBank} label="総収支" value={formatSignedYen(totals.profit)} tone={valueTone(totals.profit)} />
        <DashboardCard icon={TrendingUp} label="今月収支" value={formatSignedYen(totals.monthlyProfit)} tone={valueTone(totals.monthlyProfit)} />
        <DashboardCard icon={Trophy} label="勝率" value={`${totals.winRate.toFixed(1)}%`} />
        <DashboardCard icon={ShieldAlert} label="最大連敗" value={`${totals.maxLosingStreak}連敗`} tone={totals.maxLosingStreak >= 3 ? "bad" : "neutral"} />
      </section>

      {warnings.length > 0 && (
        <section className="grid gap-2 rounded-md border border-[#f0b8c4] bg-[#fff1f3] p-4 text-sm font-bold text-[var(--rose)]">
          {warnings.map((warning) => (
            <p key={warning} className="flex items-start gap-2">
              <AlertTriangle size={18} aria-hidden />
              {warning}
            </p>
          ))}
        </section>
      )}

      <section className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Calculator size={20} aria-hidden />
          <h2 className="text-lg font-black">期待値計算</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="機種名">
            <input className={inputClass()} value={ev.machineName} onChange={(e) => setEv({ ...ev, machineName: e.target.value })} />
          </Field>
          <Field label="大当たり確率（1/〇〇）" help="例: 399 → 1/399">
            <input className={inputClass()} type="number" min="1" placeholder="例: 399" value={ev.jackpotDenominator} onChange={(e) => updateEvNumber("jackpotDenominator", e.target.value)} />
          </Field>
          <Field label="1k回転率" help="1,000円あたり何回転するか">
            <input className={inputClass()} type="number" value={ev.spinsPerK} onChange={(e) => updateEvNumber("spinsPerK", e.target.value)} />
          </Field>
          <Field label="ボーダー回転率" help="損益分岐の目安になる回転率">
            <input className={inputClass()} type="number" value={ev.borderSpins} onChange={(e) => updateEvNumber("borderSpins", e.target.value)} />
          </Field>
          <Field label="大当たり1回あたりの平均出玉" help="ラッシュ込みで平均何玉獲得できるか">
            <input className={inputClass()} type="number" value={ev.averagePayout} onChange={(e) => updateEvNumber("averagePayout", e.target.value)} />
          </Field>
          <Field
            label="交換率（1玉あたりの円）"
            help={
              <>
                例: 28玉交換 = 3.57
                <br />
                30玉交換 = 3.33
              </>
            }
          >
            <input className={inputClass()} type="number" step="0.01" value={ev.exchangeRate} onChange={(e) => updateEvNumber("exchangeRate", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="ボーダー差" value={`${evResult.rotationDiff.toFixed(1)}回`} tone={valueTone(evResult.rotationDiff)} />
          <StatCard label="回転率差" value={`${evResult.rotationDiffRate.toFixed(1)}%`} tone={valueTone(evResult.rotationDiff)} />
          <StatCard label="1k期待値" value={formatSignedYen(evResult.evPer1k)} tone={valueTone(evResult.evPer1k)} />
          <StatCard label="1000回転期待値" value={formatSignedYen(evResult.evPer1000)} tone={valueTone(evResult.evPer1000)} />
          <StatCard label="期待値ランク" value={`ランク ${evResult.rank}`} tone={evResult.rank === "D" ? "bad" : evResult.rank === "C" ? "neutral" : "good"} />
        </div>
        <div
          className={`mt-3 rounded-md border p-4 text-sm font-black leading-6 ${
            evResult.rotationDiff >= 0
              ? "border-[#9accc3] bg-[#e9f7f4] text-[var(--teal-dark)]"
              : "border-[#f0b8c4] bg-[#fff1f3] text-[var(--rose)]"
          }`}
        >
          {evResult.comment}
        </div>
      </section>

      <section className="rounded-md border border-[var(--line)] bg-[var(--panel)] shadow-sm">
        <button
          type="button"
          onClick={() => setIsRecordFormOpen((current) => !current)}
          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left font-black"
          aria-expanded={isRecordFormOpen}
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={20} aria-hidden />
            収支を登録
          </span>
          <ChevronDown size={20} aria-hidden className={`transition ${isRecordFormOpen ? "rotate-180" : ""}`} />
        </button>
        {isRecordFormOpen && (
          <form
            action={addRecord}
            className="grid gap-3 border-t border-[var(--line)] p-4 sm:grid-cols-2"
            onSubmit={(event) => {
              const form = event.currentTarget;
              setTimeout(() => form.reset(), 0);
            }}
          >
            <Field label="日付">
              <input className={inputClass()} name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>
            <Field label="種別">
              <select className={inputClass()} name="type" defaultValue="玉">
                <option>玉</option>
                <option>枚</option>
              </select>
            </Field>
            <Field label="機種名">
              <input className={inputClass()} name="machine" required />
            </Field>
            <Field label="店舗名">
              <input className={inputClass()} name="hall" required />
            </Field>
            <Field label="投資金額">
              <input className={inputClass()} name="investment" type="number" min="0" required />
            </Field>
            <Field label="回収金額">
              <input className={inputClass()} name="recovery" type="number" min="0" required />
            </Field>
            <Field label="差玉・差枚">
              <input className={inputClass()} name="unitDiff" type="number" />
            </Field>
            <Field label="メモ">
              <input className={inputClass()} name="memo" />
            </Field>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--teal)] px-4 font-black text-white sm:col-span-2" type="submit">
              <Plus size={18} aria-hidden />
              登録
            </button>
          </form>
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center gap-2">
          <LineChart size={20} aria-hidden />
          <h2 className="text-lg font-black">分析ダッシュボード</h2>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <ChartPanel title="月別収支" summary={chartSummary}>
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => formatAxisYen(Number(value))} width={54} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={chartTooltipFormatter} />
                  <Bar dataKey="net" name="収支" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry) => (
                      <Cell key={entry.month} fill={entry.net >= 0 ? "#0f766e" : "#be123c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback />
            )}
          </ChartPanel>

          <ChartPanel title="資金推移" summary={balanceSummary}>
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => formatAxisYen(Number(value))} width={54} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={balanceTooltipFormatter} />
                  <Line dataKey="balance" name="残高" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
                </ReLineChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback />
            )}
          </ChartPanel>

          <ChartPanel title="機種別収支" summary={machineSummary}>
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineData} layout="vertical" margin={{ left: 8, right: 14 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatAxisYen(Number(value))} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={86} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={chartTooltipFormatter} />
                  <Bar dataKey="total" name="収支" radius={[0, 4, 4, 0]}>
                    {machineData.map((entry) => (
                      <Cell key={entry.name} fill={entry.total >= 0 ? "#0f766e" : "#be123c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback />
            )}
          </ChartPanel>

          <ChartPanel title="店舗別収支" summary={hallSummary}>
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hallData} layout="vertical" margin={{ left: 8, right: 14 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatAxisYen(Number(value))} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={86} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={chartTooltipFormatter} />
                  <Bar dataKey="total" name="収支" radius={[0, 4, 4, 0]}>
                    {hallData.map((entry) => (
                      <Cell key={entry.name} fill={entry.total >= 0 ? "#0f766e" : "#be123c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback />
            )}
          </ChartPanel>

          <ChartPanel title="曜日別収支" summary={weekdaySummary}>
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => formatAxisYen(Number(value))} width={54} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={chartTooltipFormatter} />
                  <Bar dataKey="total" name="収支" fill="#b7791f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback />
            )}
          </ChartPanel>

          <section className="grid content-start gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} aria-hidden />
              <h3 className="text-base font-black">投資分析</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              <StatCard label="平均投資" value={formatYen(totals.averageInvestment)} />
              <StatCard label="平均回収" value={formatYen(totals.averageRecovery)} />
              <StatCard label="最大投資" value={formatYen(totals.maxInvestment)} />
              <StatCard label="最大回収" value={formatYen(totals.maxRecovery)} />
              <StatCard label="総投資" value={formatYen(totals.investment)} />
              <StatCard label="総回収" value={formatYen(totals.recovery)} />
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <WalletCards size={20} aria-hidden />
          <h2 className="text-lg font-black">資金設定</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["軍資金", "bankroll"],
            ["1日上限", "dailyLimit"],
            ["1週間上限", "weeklyLimit"],
            ["1ヶ月上限", "monthlyLimit"],
          ].map(([label, key]) => (
            <Field key={key} label={label}>
              <input
                className={inputClass()}
                type="number"
                value={settings[key as keyof BankrollSettings]}
                onChange={(event) => setSettings({ ...settings, [key]: sanitizeNumericInput(event.target.value) })}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
        <h2 className="text-lg font-black">収支一覧</h2>
        {sortedRecords.length === 0 ? (
          <p className="rounded-md bg-[#eef1ed] px-3 py-8 text-center text-sm font-bold text-[var(--muted)]">
            まだ収支レコードがありません
          </p>
        ) : (
          <div className="grid gap-3">
            {sortedRecords.map((record) => {
              const profit = profitOf(record);
              return (
                <article key={record.id} className="grid min-w-0 gap-3 rounded-md border border-[var(--line)] bg-white p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--muted)]">{record.date}</p>
                      <h3 className="truncate text-base font-black">{record.machine}</h3>
                      <p className="truncate text-sm font-bold text-[var(--muted)]">{record.hall}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="削除"
                      title="削除"
                      onClick={() => setRecords((current) => current.filter((row) => row.id !== record.id))}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-white"
                    >
                      <Trash2 size={17} aria-hidden />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <RecordMetric label="投資" value={formatYen(record.investment)} />
                    <RecordMetric label="回収" value={formatYen(record.recovery)} />
                    <RecordMetric label="差玉・差枚" value={`${number.format(record.unitDiff)} ${record.type}`} />
                    <RecordMetric label="収支" value={formatSignedYen(profit)} tone={valueTone(profit)} />
                  </div>
                  {record.memo && <p className="text-sm font-bold text-[var(--muted)]">{record.memo}</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="grid gap-2 border-t border-[var(--line)] pt-5 text-center text-sm font-bold text-[var(--muted)]">
        <p>Version 0.1.0</p>
        <p>Open Source Project</p>
        <p>MIT License</p>
        <a className="inline-flex items-center justify-center gap-2 text-[var(--teal-dark)]" href={GITHUB_URL} target="_blank" rel="noreferrer">
          <GitFork size={18} aria-hidden />
          GitHub
        </a>
      </footer>
    </main>
  );
}

function RecordMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="min-w-0 rounded-md bg-[#f5f7f4] p-2">
      <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
      <p className={`mt-1 break-words text-sm font-black ${toneClass(tone)}`}>{value}</p>
    </div>
  );
}
