export default function StatCard({ icon: Icon, label, value, unit, accent }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent || "bg-primary/10"}`}>
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground tracking-tight">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}