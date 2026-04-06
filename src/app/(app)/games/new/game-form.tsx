"use client";

import { addGame } from "@/app/actions/games";
import { createSport } from "@/app/actions/sports";
import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type SportRow = { id: string; name: string };

function SportPicker({
  sports,
  selectedId,
  onSelect,
  onCreateNew,
}: {
  sports: SportRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedSport = sports.find((s) => s.id === selectedId);

  const displayList = search.trim()
    ? sports.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : sports;

  function handleOpen() {
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
      >
        {selectedSport ? (
          <span className="text-foreground">{selectedSport.name}</span>
        ) : (
          <span className="text-muted">Select sport</span>
        )}
        <svg
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
          />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-card shadow-xl">
            <div className="border-b border-white/10 p-2">
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sports…"
                className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/40 placeholder:text-muted focus:ring-2"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {displayList.length === 0 && search.trim() ? (
                <p className="px-3 py-3 text-sm text-muted">No results</p>
              ) : (
                displayList.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect(s.id)}
                    className={`flex w-full items-center px-3 py-2.5 text-sm hover:bg-white/5 ${
                      s.id === selectedId ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {s.name}
                  </button>
                ))
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                  onCreateNew();
                }}
                className="flex w-full items-center border-t border-white/10 px-3 py-2.5 text-sm text-primary hover:bg-white/5"
              >
                ＋ New sport…
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OpponentPicker({
  recentOpponents,
  allOpponents,
  selectedId,
  onSelect,
  disabled,
}: {
  recentOpponents: UserRow[];
  allOpponents: UserRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedUser = allOpponents.find((u) => u.id === selectedId);

  const displayList = search.trim()
    ? allOpponents.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase())
      )
    : recentOpponents;

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
    // focus search on next tick after render
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selectedUser ? (
          <span className="flex items-center gap-2">
            <UserAvatar
              username={selectedUser.username}
              avatarUrl={selectedUser.avatar_url}
              size="sm"
            />
            <span className="text-foreground">{selectedUser.username}</span>
          </span>
        ) : (
          <span className="text-muted">Select opponent</span>
        )}
        <svg
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
          />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-card shadow-xl">
            <div className="border-b border-white/10 p-2">
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search opponents…"
                className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/40 placeholder:text-muted focus:ring-2"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {!search.trim() && recentOpponents.length > 0 && (
                <p className="px-3 pb-1 pt-2 text-xs text-muted">Recently played</p>
              )}
              {displayList.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted">No results</p>
              ) : (
                displayList.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 ${
                      u.id === selectedId ? "text-primary" : "text-foreground"
                    }`}
                  >
                    <UserAvatar
                      username={u.username}
                      avatarUrl={u.avatar_url}
                      size="sm"
                    />
                    {u.username}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function GameForm({
  sports: initialSports,
  opponents,
  recentOpponents,
  initialSportId,
}: {
  sports: SportRow[];
  opponents: UserRow[];
  recentOpponents: UserRow[];
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
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>("");

  const canSubmit = sports.length > 0 && opponents.length > 0 && !!selectedOpponentId;
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
      <div>
        <label className="text-xs font-medium text-muted">Sport</label>
        <input type="hidden" name="sport_id" value={selectedSportId} />
        <SportPicker
          sports={sports}
          selectedId={selectedSportId}
          onSelect={(id) => {
            setSelectedSportId(id);
            setShowNewSport(false);
          }}
          onCreateNew={() => setShowNewSport(true)}
        />
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
              onClick={() => {
                setShowNewSport(false);
                setNewSportName("");
                setNewSportError(null);
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </form>
        ) : null}
        {newSportError ? <p className="mt-1 text-xs text-red-400">{newSportError}</p> : null}
      </div>

      <div>
        <label className="text-xs font-medium text-muted">Opponent</label>
        {/* hidden input so FormData picks up the selected opponent */}
        <input type="hidden" name="opponent_id" value={selectedOpponentId} />
        <OpponentPicker
          recentOpponents={recentOpponents}
          allOpponents={opponents}
          selectedId={selectedOpponentId}
          onSelect={setSelectedOpponentId}
          disabled={opponents.length === 0}
        />
        {opponents.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            No other users yet. Ask someone else to open this app and tap{" "}
            <span className="text-foreground">Add new user</span> on the sign-in screen,
            or sign out and create another profile yourself.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="my_score" className="text-xs font-medium text-muted">
            Your score
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
            Their score
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
                Use the Sport picker above to create your first sport.
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
    </form>
  );
}
