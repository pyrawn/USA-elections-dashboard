const MODES = [
  { id: 'party2024', label: '2024 Results' },
  { id: 'checkin2026', label: '2026 Midterm Check-in' },
];

export default function Controls({ mode, setMode, office, setOffice }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-full border border-ink/15 bg-white/60 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              mode === m.id ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'checkin2026' && (
        <div className="inline-flex rounded-full border border-ink/15 bg-white/60 p-1">
          {['Governor', 'Senate'].map((o) => (
            <button
              key={o}
              onClick={() => setOffice(o)}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                office === o ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'
              }`}
            >
              {o} races
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
