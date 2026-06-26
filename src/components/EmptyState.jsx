export default function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
    </div>
  );
}