function Swatch({ color, label, outline }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-ink/70">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{ backgroundColor: color, outline: outline ? `2px solid ${outline}` : undefined, outlineOffset: outline ? '1px' : undefined }}
      />
      {label}
    </div>
  );
}

export default function Legend({ mode }) {
  if (mode === 'party2024') {
    return (
      <div className="flex flex-wrap gap-4">
        <Swatch color="#B23A48" label="Won by Trump (R)" />
        <Swatch color="#2F5C8A" label="Won by Harris (D)" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <Swatch color="#B23A48" label="Republican win" />
      <Swatch color="#2F5C8A" label="Democratic win" />
      <Swatch color="#D8CBA0" label="Too close to call" />
      <Swatch color="#E4DFD3" label="No race in 2026" />
      <Swatch color="#2F5C8A" outline="#E8B23A" label="Voted Trump '24, elected a Democrat '26" />
    </div>
  );
}
