function Bone({ className }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.07] ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-10">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.07] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="flex gap-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-white/[0.07]" />
          <div className="flex flex-1 flex-col gap-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-5 w-36" />
            <Bone className="h-3 w-48" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5">
          <Bone className="h-10 w-full max-w-xs rounded-xl" />
          <div className="grid grid-cols-3 gap-2 sm:max-w-md">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-background/60 px-3 py-3 text-center"
              >
                <Bone className="mx-auto h-2.5 w-10" />
                <Bone className="mx-auto mt-2 h-6 w-8" />
              </div>
            ))}
          </div>
          <Bone className="h-12 w-full rounded-xl sm:max-w-xs" />
        </div>
      </section>

      <section>
        <Bone className="h-5 w-32" />
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
            >
              <div className="flex flex-col gap-1.5">
                <Bone className="h-4 w-28" />
                <Bone className="h-3 w-36" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Bone className="h-5 w-12" />
                <Bone className="h-3 w-8" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Bone className="h-5 w-28" />
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/[0.07]" />
                <Bone className="h-4 w-24" />
              </div>
              <Bone className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
