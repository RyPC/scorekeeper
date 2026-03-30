function Bone({ className }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.07] ${className ?? ""}`} />;
}

export default function NewGameLoading() {
  return (
    <div className="animate-pulse">
      <Bone className="mb-4 h-7 w-32" />
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-card p-4">
        <Bone className="h-10 w-full rounded-xl" />

        <div className="flex flex-col gap-1.5">
          <Bone className="h-3 w-10" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Bone className="h-3 w-16" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bone className="h-3 w-20" />
              <Bone className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Bone className="h-3 w-24" />
          <Bone className="h-20 w-full rounded-lg" />
        </div>

        <Bone className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
