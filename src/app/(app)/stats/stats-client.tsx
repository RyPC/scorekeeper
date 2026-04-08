"use client";

import { RatingsSection } from "@/app/(app)/stats/ratings-section";
import { UserAvatar } from "@/components/UserAvatar";
import { type GameRow, opponentUserIdsForGame, scoresForUser } from "@/lib/game-stats";
import { type PlayerRating } from "@/lib/ratings";
import { format } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
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

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type SportRow = { id: string; name: string };

type ChartRow = {
  index: number;
  label: string;
  cumulativeWins: number;
  margin: number;
  winRate: number;
  date: string;
  myScore: number;
  theirScore: number;
  result: "W" | "L" | "T";
};

type SportModeRating = PlayerRating & {
  key: string;
  sportId: string;
  sportName: string;
  gameType: "1v1" | "2v2" | "3v3" | "4v4" | "5v5";
};

type RatingView = "overall" | string;

type LeaderboardEntry = {
  userId: string;
  user: UserRow | null;
  rank: number;
  rating: PlayerRating;
};

const HORIZONTAL_SCROLL_CLASS =
  "-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:hover:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent";

function WinRateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const resultLabel = d.result === "W" ? "Win" : d.result === "L" ? "Loss" : "Tie";
  const resultColor =
    d.result === "W" ? "#4ade80" : d.result === "L" ? "#f87171" : "#b0b0b0";

  return (
    <div className="rounded-lg border border-white/10 bg-[#1e1e1e] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold" style={{ color: resultColor }}>
        {resultLabel} - {d.myScore}-{d.theirScore}
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

function WinRateChart({ data }: { data: ChartRow[] }) {
  if (data.length === 0) return null;

  const maxRate = Math.max(...data.map((d) => d.winRate));
  const minRate = Math.min(...data.map((d) => d.winRate));

  const peakPoint = maxRate > 50 ? data.find((d) => d.winRate === maxRate) : undefined;
  const troughPoint = minRate < 50 ? data.find((d) => d.winRate === minRate) : undefined;

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#b0b0b0", fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#b0b0b0", fontSize: 10 }}
            width={36}
          />
          <ReferenceLine y={50} stroke="#555" strokeDasharray="4 4" />
          <Tooltip content={<WinRateTooltip />} />
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
            <ReferenceDot
              x={peakPoint.label}
              y={peakPoint.winRate}
              r={5}
              fill="#4ade80"
              stroke="#121212"
              strokeWidth={1.5}
            />
          ) : null}
          {troughPoint ? (
            <ReferenceDot
              x={troughPoint.label}
              y={troughPoint.winRate}
              r={5}
              fill="#f87171"
              stroke="#121212"
              strokeWidth={1.5}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WinProgressionChart({ data }: { data: ChartRow[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#b0b0b0", fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#b0b0b0", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#1e1e1e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="cumulativeWins"
            stroke="#bb86fc"
            strokeWidth={2}
            dot={false}
            name="Cumulative wins"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MarginPerGameChart({ data }: { data: ChartRow[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#b0b0b0", fontSize: 11 }} />
          <YAxis tick={{ fill: "#b0b0b0", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#1e1e1e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
          />
          <Line
            type="monotone"
            dataKey="margin"
            stroke="#64b5f6"
            strokeWidth={2}
            dot={{ r: 2, fill: "#64b5f6" }}
            name="Margin"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatsClient({
  sports,
  games,
  userMap,
  userId,
  overallRating,
  modeRatings,
  overallRank,
  leaderboards,
  friendIds,
}: {
  sports: SportRow[];
  games: GameRow[];
  userMap: Record<string, UserRow>;
  userId: string;
  overallRating: PlayerRating;
  modeRatings: SportModeRating[];
  overallRank: number | null;
  leaderboards: Record<RatingView, LeaderboardEntry[]>;
  friendIds: string[];
}) {
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [marginOpen, setMarginOpen] = useState(false);

  const sportsWithGames = useMemo(() => {
    const ids = new Set(games.map((g) => g.sport_id));
    return sports.filter((s) => ids.has(s.id));
  }, [sports, games]);

  const filteredGames = useMemo(
    () => (selectedSportId ? games.filter((g) => g.sport_id === selectedSportId) : games),
    [games, selectedSportId]
  );

  const totals = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const g of filteredGames) {
      const s = scoresForUser(g, userId);
      pointsFor += s.mine;
      pointsAgainst += s.theirs;
      if (s.won) wins++;
      else if (s.lost) losses++;
      else ties++;
    }

    return { games: filteredGames.length, wins, losses, ties, pointsFor, pointsAgainst };
  }, [filteredGames, userId]);

  const overallMargin = totals.pointsFor - totals.pointsAgainst;

  const byOpponent = useMemo(() => {
    const byOpp: Record<
      string,
      { wins: number; losses: number; ties: number; pf: number; pa: number }
    > = {};

    for (const g of filteredGames) {
      const oppIds = opponentUserIdsForGame(g, userId);
      if (oppIds.length === 0) continue;
      const s = scoresForUser(g, userId);
      for (const oid of oppIds) {
        if (!byOpp[oid]) byOpp[oid] = { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
        byOpp[oid].pf += s.mine;
        byOpp[oid].pa += s.theirs;
        if (s.won) byOpp[oid].wins++;
        else if (s.lost) byOpp[oid].losses++;
        else byOpp[oid].ties++;
      }
    }

    return Object.entries(byOpp)
      .map(([id, v]) => ({ opponent: userMap[id] as UserRow | undefined, ...v }))
      .sort((a, b) => b.wins + b.losses + b.ties - (a.wins + a.losses + a.ties));
  }, [filteredGames, userId, userMap]);

  const chartSeries = useMemo(() => {
    let cumulativeWins = 0;

    return filteredGames.map((g, i) => {
      const s = scoresForUser(g, userId);
      if (s.won) cumulativeWins++;
      const played = i + 1;

      return {
        index: played,
        label: `G${played}`,
        cumulativeWins,
        margin: s.mine - s.theirs,
        winRate: Math.round((cumulativeWins / played) * 100),
        date: format(new Date(g.created_at), "MMM d, yyyy"),
        myScore: s.mine,
        theirScore: s.theirs,
        result: (s.won ? "W" : s.lost ? "L" : "T") as "W" | "L" | "T",
      };
    });
  }, [filteredGames, userId]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stats & history</h1>
        <p className="mt-1 text-sm text-muted">
          Lifetime performance and head-to-head breakdown.
        </p>
      </div>

      <RatingsSection
        userId={userId}
        overallRating={overallRating}
        modeRatings={modeRatings}
        overallRank={overallRank}
        leaderboards={leaderboards}
        friendIds={friendIds}
      />

      {sportsWithGames.length > 0 ? (
        <div className={HORIZONTAL_SCROLL_CLASS}>
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

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Head-to-head</h2>
        <p className="mt-1 text-sm text-muted">
          Your record against each player (1v1 and team games). Tap a row for history.
        </p>
        {byOpponent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No games recorded yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {byOpponent.map((row) => {
              const played = row.wins + row.losses + row.ties;
              const winRate = played > 0 ? row.wins / played : 0;
              const key = row.opponent?.id ?? `orphan-${row.pf}-${row.pa}`;
              return (
                <li key={key}>
                  <Link
                    href={row.opponent ? `/players/${row.opponent.id}` : "#"}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-card px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/5 active:scale-[0.99]"
                  >
                    {row.opponent ? (
                      <UserAvatar
                        username={row.opponent.username}
                        avatarUrl={row.opponent.avatar_url}
                        size="sm"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {row.opponent?.username ?? "Unknown"}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-1 tabular-nums">
                        <span className="text-lg font-bold text-emerald-400">{row.wins}</span>
                        <span className="text-xs text-muted">-</span>
                        <span className="text-lg font-bold text-rose-400">{row.losses}</span>
                        {row.ties > 0 ? (
                          <>
                            <span className="text-xs text-muted">-</span>
                            <span className="text-lg font-bold text-foreground">{row.ties}</span>
                          </>
                        ) : null}
                      </div>
                      <div className="hidden w-14 sm:block">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-400/70"
                            style={{ width: `${winRate * 100}%` }}
                          />
                        </div>
                      </div>
                      {row.opponent ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 text-muted/50"
                          aria-hidden
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Summary</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Games</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">{totals.games}</dd>
          </div>
          <div>
            <dt className="text-muted">Wins</dt>
            <dd className="text-lg font-semibold tabular-nums text-emerald-400">{totals.wins}</dd>
          </div>
          <div>
            <dt className="text-muted">Losses</dt>
            <dd className="text-lg font-semibold tabular-nums text-rose-300">{totals.losses}</dd>
          </div>
          <div>
            <dt className="text-muted">Ties</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">{totals.ties}</dd>
          </div>
          <div>
            <dt className="text-muted">Points for</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">
              {totals.pointsFor}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Points against</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">
              {totals.pointsAgainst}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Overall margin</dt>
            <dd
              className={`text-lg font-semibold tabular-nums ${
                overallMargin > 0
                  ? "text-emerald-400"
                  : overallMargin < 0
                    ? "text-rose-300"
                    : "text-foreground"
              }`}
            >
              {overallMargin > 0 ? "+" : ""}
              {overallMargin}
            </dd>
          </div>
        </dl>
      </section>

      {chartSeries.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Win rate over time</h2>
          <p className="mt-1 text-xs text-muted">
            Your win percentage after each game (chronological order).
          </p>
          <div className="mt-4">
            <WinRateChart data={chartSeries} />
          </div>
          <p className="mt-2 text-center text-[10px] text-muted">
            Green dot = personal best - Red dot = lowest point - Dashed line = 50%
          </p>
        </section>
      ) : null}

      {chartSeries.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Win progression</h2>
          <p className="mt-1 text-xs text-muted">
            Cumulative wins across games (chronological order).
          </p>
          <div className="mt-4">
            <WinProgressionChart data={chartSeries} />
          </div>
        </section>
      ) : null}

      {chartSeries.length > 0 ? (
        <>
          <section className="hidden rounded-xl border border-white/10 bg-card p-4 md:block">
            <h2 className="text-sm font-semibold text-foreground">Margin per game</h2>
            <p className="mt-1 text-xs text-muted">Your score minus opponent (per game).</p>
            <div className="mt-4">
              <MarginPerGameChart data={chartSeries} />
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-card p-4 md:hidden">
            <button
              type="button"
              onClick={() => setMarginOpen((v) => !v)}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
              aria-expanded={marginOpen}
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">Margin per game</h2>
                <p className="mt-1 text-xs text-muted">
                  Your score minus opponent (per game). Tap to {marginOpen ? "hide" : "show"} the
                  chart.
                </p>
              </div>
              <span
                className={`shrink-0 text-muted transition-transform ${marginOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>
            {marginOpen ? (
              <div className="mt-4">
                <MarginPerGameChart data={chartSeries} />
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
