export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="bg-border h-px flex-1" />
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        or
      </span>
      <div className="bg-border h-px flex-1" />
    </div>
  );
}
