"use client";

import { getH2HGames } from "@/app/actions/games";
import { scoresForUser, type GameRow } from "@/lib/game-stats";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
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

type ChartPoint = {
  index: number;
  label: string;
  cumulative: number;
  date: string;
  myScore: number;
  theirScore: number;
  result: "W" | "L" | "T";
};

function buildChartData(games: GameRow[], userId: string): ChartPoint[] {
  let cum = 0;
  return games.map((g, i) => {
    const s = scoresForUser(g, userId);
    if (s.won) cum++;
    else if (s.lost) cum--;
    return {
      index: i + 1,
      label: `G${i + 1}`,
      cumulative: cum,
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
  const resultLabel = d.result === "W" ? "Win" : d.result === "L" ? "Loss" : "Tie";
  const resultColor =
    d.result === "W" ? "#4ade80" : d.result === "L" ? "#f87171" : "#b0b0b0";
  return (
    <div className="rounded-lg border border-white/10 bg-[#1e1e1e] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold" style={{ color: resultColor }}>
        {resultLabel} · {d.myScore}–{d.theirScore}
      </p>
      <p className="mt-0.5 text-[#b0b0b0]">{d.date}</p>
      <p className="mt-1 text-white">
        Net:{" "}
        <span style={{ color: d.cumulative >= 0 ? "#4ade80" : "#f87171" }}>
          {d.cumulative > 0 ? "+" : ""}
          {d.cumulative}
        </span>
      </p>
    </div>
  );
}

function H2HChart({
  data,
  userId,
}: {
  data: ChartPoint[];
  userId: string;
}) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.cumulative));
  const minVal = Math.min(...data.map((d) => d.cumulative));

  // Find first occurrence of peak and trough
  const peakPoint = maxVal > 0 ? data.find((d) => d.cumulative === maxVal) : undefined;
  const troughPoint = minVal < 0 ? data.find((d) => d.cumulative === minVal) : undefined;

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
            allowDecimals={false}
            tick={{ fill: "#b0b0b0", fontSize: 10 }}
            width={36}
          />
          <ReferenceLine y={0} stroke="#555" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#bb86fc"
            strokeWidth={2}
            dot={{ r: 3, fill: "#bb86fc", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            name="Net record"
          />
          {peakPoint ? (
            <ReferenceDot
              x={peakPoint.label}
              y={peakPoint.cumulative}
              r={5}
              fill="#4ade80"
              stroke="#121212"
              strokeWidth={1.5}
            />
          ) : null}
          {troughPoint ? (
            <ReferenceDot
              x={troughPoint.label}
              y={troughPoint.cumulative}
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

export function FriendH2HModal({
  friend,
  userId,
  onClose,
}: {
  friend: UserRow | null;
  userId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartPoint[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const prevFriendId = useRef<string | null>(null);

  useEffect(() => {
    if (!friend) {
      setChartData(null);
      setFetchError(null);
      prevFriendId.current = null;
      return;
    }
    if (friend.id === prevFriendId.current) return;
    prevFriendId.current = friend.id;

    setLoading(true);
    setChartData(null);
    setFetchError(null);

    getH2HGames(friend.id).then((res) => {
      setLoading(false);
      if (res.error) {
        setFetchError(res.error);
      } else {
        setChartData(buildChartData(res.data ?? [], userId));
      }
    });
  }, [friend, userId]);

  if (!friend) return null;

  const wins = chartData?.filter((d) => d.result === "W").length ?? 0;
  const losses = chartData?.filter((d) => d.result === "L").length ?? 0;
  const ties = chartData?.filter((d) => d.result === "T").length ?? 0;
  const net = chartData ? chartData[chartData.length - 1]?.cumulative ?? 0 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet — bottom drawer on mobile, centered dialog on sm+ */}
      <div
        role="dialog"
        aria-modal
        aria-label={`Head-to-head vs ${friend.username}`}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-5 rounded-t-2xl border-t border-white/10 bg-[#121212] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              vs {friend.username}
            </h2>
            <p className="text-xs text-muted">Head-to-head record over time</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm text-muted hover:border-white/25 hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Summary pills */}
        {chartData && chartData.length > 0 ? (
          <div className="flex gap-2">
            <span className="rounded-lg border border-white/10 bg-card px-3 py-1.5 text-xs tabular-nums">
              <span className="font-semibold text-emerald-400">{wins}W</span>
              <span className="text-muted"> · </span>
              <span className="font-semibold text-rose-300">{losses}L</span>
              {ties > 0 ? (
                <>
                  <span className="text-muted"> · </span>
                  <span className="font-semibold text-foreground">{ties}T</span>
                </>
              ) : null}
            </span>
            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tabular-nums ${
                net > 0
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                  : net < 0
                    ? "border-rose-300/30 bg-rose-300/10 text-rose-300"
                    : "border-white/10 bg-card text-muted"
              }`}
            >
              Net {net > 0 ? "+" : ""}
              {net}
            </span>
          </div>
        ) : null}

        {/* Chart / states */}
        {loading ? (
          <div className="flex h-52 items-center justify-center text-sm text-muted">
            Loading…
          </div>
        ) : fetchError ? (
          <div className="flex h-52 items-center justify-center text-sm text-red-400">
            {fetchError}
          </div>
        ) : chartData && chartData.length === 0 ? (
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-white/15 bg-card/30 text-sm text-muted">
            No games played yet.
          </div>
        ) : chartData ? (
          <div>
            <H2HChart data={chartData} userId={userId} />
            <p className="mt-2 text-center text-[10px] text-muted">
              Green dot = personal best · Red dot = worst point · Dashed line = break even
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
