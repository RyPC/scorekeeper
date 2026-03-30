function Bone({ className }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.07] ${className ?? ""}`} />;
}

export default function FriendsLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <section>
        <Bone className="h-3 w-24" />
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/[0.07]" />
                <Bone className="h-4 w-28" />
              </div>
              <Bone className="h-9 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <Bone className="h-3 w-20" />
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/[0.07]" />
                <Bone className="h-4 w-28" />
              </div>
              <Bone className="h-9 w-14 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
