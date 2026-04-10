"use client";

import { UserAvatar } from "@/components/UserAvatar";
import { scoresForUser, type GameRow } from "@/lib/game-stats";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UserRow = { id: string; username: string; avatar_url: string | null };

type ChartPoint = {
  index: number;
  label: string;
  winRate: number;
  date: string;
  myScore: number;
  theirScore: number;
  result: "W" | "L" | "T";
};

function buildChartData(games: GameRow[], userId: string): ChartPoint[] {
  let wins = 0;
  return games.map((g, i) => {
    const s = scoresForUser(g, userId);
    if (s.won) wins++;
    const played = i + 1;
    return {
      index: played,
      label: `G${played}`,
      winRate: Math.round((wins / played) * 100),
      date: format(new Date(g.created_at), "MMM d, yyyy"),
      myScore: s.mine,
      theirScore: s.theirs,
      result: s.won ? "W" : s.lost ? "L" : "T",
    };
  });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const resultColor = d.result === "W" ? "#4ade80" : d.result === "L" ? "#f87171" : "#b0b0b0";
  const resultLabel = d.result === "W" ? "Win" : d.result === "L" ? "Loss" : "Tie";
  return (
    <div className="rounded-lg border border-white/10 bg-[#1e1e1e] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold" style={{ color: resultColor }}>
        {resultLabel} · {d.myScore}–{d.theirScore}
      </p>
      <p className="mt-0.5 text-[#b0b0b0]">{d.date}</p>
      <p className="mt-1 text-white">
        Win rate:{" "}
        <span style={{ color: d.winRate >= 50 ? "#4ade80" : "#f87171" }}>
          {d.winRate}%
        </span>
      </p>
    </div>
  );
}

function H2HChart({ data }: { data: ChartPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (data.length === 0) return null;
  if (!mounted) return <div className="h-52 w-full" />;

  const maxVal = Math.max(...data.map((d) => d.winRate));
  const minVal = Math.min(...data.map((d) => d.winRate));
  const peakPoint = maxVal > 50 ? data.find((d) => d.winRate === maxVal) : undefined;
  const troughPoint = minVal < 50 ? data.find((d) => d.winRate === minVal) : undefined;

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#b0b0b0", fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#b0b0b0", fontSize: 10 }} width={40} />
          <ReferenceLine y={50} stroke="#555" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="#bb86fc"
            strokeWidth={2}
            dot={{ r: 3, fill: "#bb86fc", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            name="Win rate"
          />
          {peakPoint ? (
            <ReferenceDot x={peakPoint.label} y={peakPoint.winRate} r={5} fill="#4ade80" stroke="#121212" strokeWidth={1.5} />
          ) : null}
          {troughPoint ? (
            <ReferenceDot x={troughPoint.label} y={troughPoint.winRate} r={5} fill="#f87171" stroke="#121212" strokeWidth={1.5} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlayerClient({
  opponent,
  currentUserId,
  allGames,
  sportMap,
}: {
  opponent: UserRow;
  currentUserId: string;
  allGames: GameRow[];
  sportMap: Record<string, string>;
}) {
  const router = useRouter();

  // Sports that appear in these H2H games, in encounter order
  const sportsWithGames = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    for (const g of allGames) {
      if (!seen.has(g.sport_id)) {
        seen.add(g.sport_id);
        result.push({ id: g.sport_id, name: sportMap[g.sport_id] ?? "Unknown" });
      }
    }
    return result;
  }, [allGames, sportMap]);

  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);

  const filteredGames = useMemo(
    () => (selectedSportId ? allGames.filter((g) => g.sport_id === selectedSportId) : allGames),
    [allGames, selectedSportId]
  );

  const record = useMemo(() => {
    let wins = 0, losses = 0, ties = 0;
    for (const g of filteredGames) {
      const s = scoresForUser(g, currentUserId);
      if (s.won) wins++;
      else if (s.lost) losses++;
      else ties++;
    }
    return { wins, losses, ties };
  }, [filteredGames, currentUserId]);

  // By-sport breakdown always uses all games (summary view)
  const bySport = useMemo(() => {
    const map: Record<string, { name: string; wins: number; losses: number; ties: number }> = {};
    for (const g of allGames) {
      const s = scoresForUser(g, currentUserId);
      if (!map[g.sport_id]) {
        map[g.sport_id] = { name: sportMap[g.sport_id] ?? "Unknown", wins: 0, losses: 0, ties: 0 };
      }
      if (s.won) map[g.sport_id].wins++;
      else if (s.lost) map[g.sport_id].losses++;
      else map[g.sport_id].ties++;
    }
    return Object.values(map).sort(
      (a, b) => (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties)
    );
  }, [allGames, currentUserId, sportMap]);

  const recentGames = useMemo(() => {
    return [...filteredGames]
      .reverse()
      .slice(0, 20)
      .map((g) => {
        const s = scoresForUser(g, currentUserId);
        return {
          id: g.id,
          sportName: sportMap[g.sport_id] ?? "Unknown",
          createdAt: g.created_at,
          myScore: s.mine,
          theirScore: s.theirs,
          result: s.won ? ("W" as const) : s.lost ? ("L" as const) : ("T" as const),
          notes: g.notes ?? null,
        };
      });
  }, [filteredGames, currentUserId, sportMap]);

  const chartData = useMemo(
    () => buildChartData(filteredGames, currentUserId),
    [filteredGames, currentUserId]
  );

  const net = record.wins - record.losses;
  const played = record.wins + record.losses + record.ties;

  return (
    <div className="flex flex-col gap-8">
      {/* Back + header */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-4">
          <UserAvatar username={opponent.username} avatarUrl={opponent.avatar_url} size="lg" />
          <div>
            <p className="text-sm text-muted">Head-to-head vs</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {opponent.username}
            </h1>
          </div>
        </div>
      </div>

      {/* Sport filter pills */}
      {sportsWithGames.length > 1 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSportId(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selectedSportId === null
                ? "bg-primary text-[#121212]"
                : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
            }`}
          >
            All
          </button>
          {sportsWithGames.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSportId(s.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedSportId === s.id
                  ? "bg-primary text-[#121212]"
                  : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      {/* Content */}
      {played === 0 ? (
        <p className="text-sm text-muted">
          {selectedSportId ? "No games in this sport yet." : "No games played yet."}
        </p>
      ) : (
        <>
          {/* Record summary */}
          <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.07] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {selectedSportId ? (sportMap[selectedSportId] ?? "Sport") : "Overall"} record
            </p>
            <div className="mt-3 flex items-baseline gap-2 tabular-nums">
              <span className="text-4xl font-bold text-emerald-400">{record.wins}</span>
              <span className="text-xl text-muted">–</span>
              <span className="text-4xl font-bold text-rose-400">{record.losses}</span>
              {record.ties > 0 ? (
                <>
                  <span className="text-xl text-muted">–</span>
                  <span className="text-4xl font-bold text-foreground">{record.ties}</span>
                </>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg border border-white/10 bg-background/60 px-3 py-1.5 text-xs text-muted">
                {played} {played === 1 ? "game" : "games"}
              </span>
              <span
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tabular-nums ${
                  net > 0
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                    : net < 0
                      ? "border-rose-400/30 bg-rose-400/10 text-rose-400"
                      : "border-white/10 bg-background/60 text-muted"
                }`}
              >
                Net {net > 0 ? "+" : ""}{net}
              </span>
            </div>

            {/* Win rate bar */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400/70 transition-all"
                  style={{ width: `${(record.wins / played) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {Math.round((record.wins / played) * 100)}% win rate
              </p>
            </div>
          </section>

          {/* Chart */}
          {chartData.length > 0 ? (
            <section className="rounded-xl border border-white/10 bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground">Win rate over time</h2>
              <p className="mt-1 text-xs text-muted">
                % of games won after each result. Dashed line = 50%. Green dot = best · Red dot = worst.
              </p>
              <div className="mt-4">
                <H2HChart data={chartData} />
              </div>
            </section>
          ) : null}

          {/* By sport — only shown in "All" view when there are multiple sports */}
          {!selectedSportId && bySport.length > 1 ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">By sport</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {bySport.map((s) => {
                  const sportPlayed = s.wins + s.losses + s.ties;
                  return (
                    <li
                      key={s.name}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
                    >
                      <span className="font-medium text-foreground">{s.name}</span>
                      <div className="flex items-baseline gap-1 tabular-nums">
                        <span className="text-lg font-bold text-emerald-400">{s.wins}</span>
                        <span className="text-xs text-muted">–</span>
                        <span className="text-lg font-bold text-rose-400">{s.losses}</span>
                        {s.ties > 0 ? (
                          <>
                            <span className="text-xs text-muted">–</span>
                            <span className="text-lg font-bold text-foreground">{s.ties}</span>
                          </>
                        ) : null}
                        <span className="ml-2 text-xs text-muted">
                          ({sportPlayed} {sportPlayed === 1 ? "game" : "games"})
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {/* Recent games */}
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Recent games</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {recentGames.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl border border-white/10 bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted">{g.sportName}</p>
                      <p className="text-xs text-muted/70">
                        {format(new Date(g.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        {g.myScore} – {g.theirScore}
                      </p>
                      <span
                        className={`w-8 rounded-md px-1.5 py-0.5 text-center text-xs font-bold ${
                          g.result === "W"
                            ? "bg-emerald-400/15 text-emerald-400"
                            : g.result === "L"
                              ? "bg-rose-400/15 text-rose-400"
                              : "bg-white/10 text-muted"
                        }`}
                      >
                        {g.result}
                      </span>
                    </div>
                  </div>
                  {g.notes ? (
                    <p className="mt-2 text-xs text-muted line-clamp-2">{g.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
