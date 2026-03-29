"use client";

import { UserAvatar } from "@/components/UserAvatar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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

type Totals = {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
};

type ChartRow = {
  index: number;
  label: string;
  cumulativeWins: number;
  margin: number;
};

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
  sportFilter,
  totals,
  byOpponent,
  chartSeries,
}: {
  sports: SportRow[];
  sportFilter: string | "all";
  totals: Totals;
  byOpponent: {
    opponent?: UserRow;
    wins: number;
    losses: number;
    ties: number;
    pf: number;
    pa: number;
  }[];
  chartSeries: ChartRow[];
}) {
  const router = useRouter();
  const [marginOpen, setMarginOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stats & history</h1>
        <p className="mt-1 text-sm text-muted">
          Lifetime performance and head-to-head breakdown.
        </p>
      </div>

      <div>
        <label htmlFor="stats_sport" className="text-xs font-medium text-muted">
          Filter by sport
        </label>
        <select
          id="stats_sport"
          value={sportFilter}
          onChange={(e) => {
            const v = e.target.value;
            router.push(v === "all" ? "/stats?sport=all" : `/stats?sport=${v}`);
          }}
          className="mt-1 w-full max-w-xs rounded-lg border border-white/10 bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
        >
          <option value="all">All sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <section className="rounded-xl border border-white/10 bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Summary
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Games</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">
              {totals.games}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Wins</dt>
            <dd className="text-lg font-semibold tabular-nums text-emerald-400">
              {totals.wins}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Losses</dt>
            <dd className="text-lg font-semibold tabular-nums text-rose-300">
              {totals.losses}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Ties</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">
              {totals.ties}
            </dd>
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
        </dl>
      </section>

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
              className="flex w-full min-h-[44px] items-center justify-between gap-3 text-left"
              aria-expanded={marginOpen}
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">Margin per game</h2>
                <p className="mt-1 text-xs text-muted">
                  Your score minus opponent (per game). Tap to {marginOpen ? "hide" : "show"}{" "}
                  the chart.
                </p>
              </div>
              <span
                className={`shrink-0 text-muted transition-transform ${marginOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▼
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

      <section>
        <h2 className="text-lg font-semibold tracking-tight">By opponent</h2>
        {byOpponent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No games recorded yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {byOpponent.map((row) => (
              <li
                key={row.opponent?.id ?? `orphan-${row.pf}-${row.pa}`}
                className="rounded-xl border border-white/10 bg-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {row.opponent ? (
                      <>
                        <UserAvatar
                          username={row.opponent.username}
                          avatarUrl={row.opponent.avatar_url}
                          size="sm"
                        />
                        <span className="truncate font-medium">
                          {row.opponent.username}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">Unknown</span>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-sm tabular-nums text-muted">
                    <span className="text-foreground">{row.wins}W</span> ·{" "}
                    <span className="text-foreground">{row.losses}L</span>
                    {row.ties > 0 ? (
                      <>
                        {" "}
                        · <span className="text-foreground">{row.ties}T</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  PF {row.pf} · PA {row.pa} · Diff {row.pf - row.pa >= 0 ? "+" : ""}
                  {row.pf - row.pa}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
