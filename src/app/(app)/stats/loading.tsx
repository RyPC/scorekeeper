function Bone({ className }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.07] ${className ?? ""}`} />;
}

export default function StatsLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Bone className="h-7 w-40" />
        <Bone className="h-4 w-64" />
      </div>

      <Bone className="h-10 w-full max-w-xs rounded-xl" />

      <section className="rounded-xl border border-white/10 bg-card p-4">
        <Bone className="h-3 w-16" />
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bone className="h-3 w-16" />
              <Bone className="h-6 w-10" />
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-white/10 bg-card p-4">
        <Bone className="h-4 w-32" />
        <Bone className="mt-1 h-3 w-56" />
        <Bone className="mt-4 h-56 w-full rounded-xl" />
      </section>

      <section>
        <Bone className="h-5 w-28" />
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/[0.07]" />
                <Bone className="h-4 w-24" />
              </div>
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
