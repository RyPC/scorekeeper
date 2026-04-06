"use client";

import { addGame } from "@/app/actions/games";
import { createSport } from "@/app/actions/sports";
import { UserAvatar } from "@/components/UserAvatar";
import { GAME_TYPE_LABELS, TEAM_SIZE, type GameType } from "@/lib/game-stats";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type SportRow = { id: string; name: string };

const ALL_GAME_TYPES: GameType[] = ["1v1", "2v2", "3v3", "4v4", "5v5"];

const SPORT_GAME_TYPES: { pattern: RegExp; types: GameType[] }[] = [
  { pattern: /pickleball/i, types: ["1v1", "2v2"] },
];

function PlayerSelect({
  name,
  label,
  users,
  excluded,
  value,
  onChange,
}: {
  name: string;
  label: string;
  users: UserRow[];
  excluded: Set<string>;
  value: string;
  onChange: (id: string) => void;
}) {
  const available = users.filter((u) => u.id === value || !excluded.has(u.id));
  return (
    <div>
      <label className="text-xs font-medium text-muted">{label}</label>
      <select
        name={name}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
      >
        <option value="" disabled>
          Select player
        </option>
        {available.map((u) => (
          <option key={u.id} value={u.id}>
            {u.username}
          </option>
        ))}
      </select>
    </div>
  );
}

export function GameForm({
  sports: initialSports,
  opponents,
  currentUserId,
  initialSportId,
}: {
  sports: SportRow[];
  opponents: UserRow[];
  currentUserId: string;
  initialSportId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sports, setSports] = useState<SportRow[]>(initialSports);
  const [selectedSportId, setSelectedSportId] = useState<string>(initialSportId ?? "");
  const [showNewSport, setShowNewSport] = useState(false);
  const [newSportName, setNewSportName] = useState("");
  const [newSportError, setNewSportError] = useState<string | null>(null);
  const [newSportPending, setNewSportPending] = useState(false);
  const [gameType, setGameType] = useState<GameType>("1v1");

  const allowedGameTypes = useMemo<GameType[]>(() => {
    const sport = sports.find((s) => s.id === selectedSportId);
    if (!sport) return ALL_GAME_TYPES;
    return SPORT_GAME_TYPES.find((r) => r.pattern.test(sport.name))?.types ?? ALL_GAME_TYPES;
  }, [sports, selectedSportId]);

  // Snap gameType to first allowed option if the current selection becomes unavailable.
  useEffect(() => {
    if (!allowedGameTypes.includes(gameType)) {
      setGameType(allowedGameTypes[0]);
    }
  }, [allowedGameTypes, gameType]);

  // 1v1 opponent
  const [opponentId, setOpponentId] = useState<string>("");

  // Team games: myTeam[0] is always currentUserId, slots 1..teamSize-1 are selected
  // theirTeam[0..teamSize-1] are selected
  const teamSize = TEAM_SIZE[gameType];
  const [myTeamSlots, setMyTeamSlots] = useState<string[]>(["", "", "", ""]);
  const [theirTeamSlots, setTheirTeamSlots] = useState<string[]>(["", "", "", "", ""]);

  const allUsers = opponents; // everyone except current user

  // Build the set of already-picked player IDs across both teams (for deduplication)
  function buildExcluded(skipMySlot?: number, skipTheirSlot?: number): Set<string> {
    const ids = new Set<string>([currentUserId]);
    if (gameType === "1v1") {
      if (opponentId) ids.add(opponentId);
    } else {
      for (let i = 1; i < teamSize; i++) {
        if (i !== skipMySlot && myTeamSlots[i - 1]) ids.add(myTeamSlots[i - 1]);
      }
      for (let i = 0; i < teamSize; i++) {
        if (i !== skipTheirSlot && theirTeamSlots[i]) ids.add(theirTeamSlots[i]);
      }
    }
    return ids;
  }

  const canSubmit = sports.length > 0 && opponents.length > 0;
  const blockReason =
    sports.length === 0
      ? "no-sports"
      : opponents.length === 0
        ? "no-opponents"
        : null;

  async function handleCreateSport(e: React.FormEvent) {
    e.preventDefault();
    setNewSportError(null);
    setNewSportPending(true);
    try {
      const fd = new FormData();
      fd.set("name", newSportName.trim());
      const res = await createSport(fd);
      if ("error" in res && res.error) {
        setNewSportError(res.error);
        return;
      }
      if ("ok" in res && res.ok && res.sportId) {
        const newSport = { id: res.sportId, name: newSportName.trim() };
        setSports((prev) => [...prev, newSport]);
        setSelectedSportId(res.sportId);
        setNewSportName("");
        setShowNewSport(false);
      }
    } finally {
      setNewSportPending(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const res = await addGame(formData);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      if ("ok" in res && res.ok) {
        const sid = String(formData.get("sport_id") ?? "");
        router.push(sid ? `/dashboard?sport=${sid}` : "/dashboard");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-white/10 bg-card p-4"
    >
      {/* Sport */}
      <div>
        <label htmlFor="sport_id" className="text-xs font-medium text-muted">
          Sport
        </label>
        <select
          id="sport_id"
          name="sport_id"
          required
          value={selectedSportId}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setShowNewSport(true);
            } else {
              setSelectedSportId(e.target.value);
              setShowNewSport(false);
            }
          }}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
        >
          <option value="" disabled>
            Select sport
          </option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="__new__">＋ New sport…</option>
        </select>
        {showNewSport ? (
          <form onSubmit={handleCreateSport} className="mt-2 flex gap-2">
            <input
              autoFocus
              value={newSportName}
              onChange={(e) => setNewSportName(e.target.value)}
              placeholder="Sport name"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
            />
            <button
              type="submit"
              disabled={newSportPending || !newSportName.trim()}
              className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              {newSportPending ? "…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewSport(false); setNewSportName(""); setNewSportError(null); }}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </form>
        ) : null}
        {newSportError ? <p className="mt-1 text-xs text-red-400">{newSportError}</p> : null}
      </div>

      {/* Game type */}
      <div>
        <p className="text-xs font-medium text-muted">Game type</p>
        <input type="hidden" name="game_type" value={gameType} />
        <div className="mt-1 flex flex-wrap gap-2">
          {allowedGameTypes.map((gt) => (
            <button
              key={gt}
              type="button"
              onClick={() => setGameType(gt)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                gameType === gt
                  ? "bg-primary text-[#121212]"
                  : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
              }`}
            >
              {GAME_TYPE_LABELS[gt]}
            </button>
          ))}
        </div>
      </div>

      {/* Players */}
      {gameType === "1v1" ? (
        <div>
          <label htmlFor="opponent_id" className="text-xs font-medium text-muted">
            Opponent
          </label>
          <select
            id="opponent_id"
            name="opponent_id"
            required
            value={opponentId}
            onChange={(e) => setOpponentId(e.target.value)}
            disabled={opponents.length === 0}
            className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select opponent
            </option>
            {opponents.map((f) => (
              <option key={f.id} value={f.id}>
                {f.username}
              </option>
            ))}
          </select>
          {opponents.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              No other users yet. Ask someone else to open this app and tap{" "}
              <span className="text-foreground">Add new user</span> on the sign-in screen,
              or sign out and create another profile yourself.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* My team */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Your team ({teamSize})
            </p>
            <div className="flex flex-col gap-2">
              {/* Slot 0 = current user, fixed */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-sm text-foreground">
                <span className="flex-1">You</span>
                <span className="text-xs text-muted">(you)</span>
              </div>
              {Array.from({ length: teamSize - 1 }, (_, i) => {
                const slotIndex = i; // myTeamSlots[0..teamSize-2]
                const excluded = buildExcluded(slotIndex + 1, undefined);
                return (
                  <PlayerSelect
                    key={`my_team_${i + 1}`}
                    name={`my_team_${i + 1}`}
                    label={`Teammate ${i + 1}`}
                    users={allUsers}
                    excluded={excluded}
                    value={myTeamSlots[slotIndex]}
                    onChange={(id) => {
                      setMyTeamSlots((prev) => {
                        const next = [...prev];
                        next[slotIndex] = id;
                        return next;
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Their team */}
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">
              Opposing team ({teamSize})
            </p>
            <div className="flex flex-col gap-2">
              {Array.from({ length: teamSize }, (_, i) => {
                const excluded = buildExcluded(undefined, i);
                return (
                  <PlayerSelect
                    key={`their_team_${i}`}
                    name={`their_team_${i}`}
                    label={`Opponent ${i + 1}`}
                    users={allUsers}
                    excluded={excluded}
                    value={theirTeamSlots[i]}
                    onChange={(id) => {
                      setTheirTeamSlots((prev) => {
                        const next = [...prev];
                        next[i] = id;
                        return next;
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="my_score" className="text-xs font-medium text-muted">
            {gameType === "1v1" ? "Your score" : "Your team's score"}
          </label>
          <input
            id="my_score"
            name="my_score"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            min={0}
            step={1}
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm tabular-nums text-foreground outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="their_score" className="text-xs font-medium text-muted">
            {gameType === "1v1" ? "Their score" : "Their team's score"}
          </label>
          <input
            id="their_score"
            name="their_score"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            min={0}
            step={1}
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm tabular-nums text-foreground outline-none ring-primary/40 focus:ring-2"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="text-xs font-medium text-muted">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
          placeholder="Court, conditions, etc."
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {blockReason ? (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          {blockReason === "no-sports" ? (
            <>
              <p className="font-semibold">Add a sport first</p>
              <p className="mt-1 text-muted">
                Use the Sport dropdown above to create your first sport.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">You need at least one other person</p>
              <p className="mt-1 text-muted">
                Someone else must create a profile on the sign-in screen before you can
                pick an opponent.
              </p>
              <p className="mt-2 text-xs text-muted">
                Optional: add them on{" "}
                <Link href="/friends" className="text-primary underline underline-offset-2">
                  Friends
                </Link>{" "}
                for dashboard shortcuts.
              </p>
            </>
          )}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="min-h-[48px] rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-[#121212] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log game"}
      </button>

      {opponents.length > 0 && gameType === "1v1" ? (
        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
          <p className="w-full text-xs font-medium text-muted">Accounts you can play</p>
          <div className="flex flex-wrap gap-2">
            {opponents.slice(0, 12).map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/80 px-2 py-1.5"
              >
                <UserAvatar username={f.username} avatarUrl={f.avatar_url} size="sm" />
                <span className="text-xs text-foreground">{f.username}</span>
              </div>
            ))}
            {opponents.length > 12 ? (
              <span className="self-center text-xs text-muted">
                +{opponents.length - 12} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
