const COLORS = ["var(--cobalt)", "var(--sun)", "var(--leaf)", "var(--rose)", "var(--violet)", "var(--teal)"];

export function AvatarPile({ total, capacity }: { total: number; capacity: number }) {
  const shown = Math.min(total, 14);
  const pct = capacity > 0 ? Math.min(100, Math.round((total / capacity) * 100)) : 0;
  const remaining = Math.max(0, capacity - total);

  return (
    <div className="pile">
      <div className="pile-row" aria-hidden="true">
        {Array.from({ length: shown }, (_, i) => (
          <span
            key={i}
            className="pile-dot"
            style={{ background: COLORS[i % COLORS.length], animationDelay: `${i * 45}ms` }}
          />
        ))}
        <span className="pile-dot pile-you" style={{ animationDelay: `${shown * 45}ms` }}>
          +
        </span>
      </div>
      <p className="pile-text">
        <strong>{total.toLocaleString("en-US")}</strong> {total === 1 ? "person is" : "people are"} in.{" "}
        {total === 0
          ? "Be the first."
          : remaining > 0
            ? `${remaining.toLocaleString("en-US")} spots left.`
            : "The list is full."}
      </p>
      <div
        className="bar"
        role="progressbar"
        aria-label="How full the directory is"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
