type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="flex aspect-square flex-col justify-between rounded-3xl border border-white/8 bg-white/5 p-3 shadow-sm shadow-black/20 sm:p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}</div>
      <div className="text-3xl font-semibold text-white sm:text-4xl">{value}</div>
      {helper ? <div className="text-xs text-zinc-400 sm:text-sm">{helper}</div> : null}
    </div>
  );
}
