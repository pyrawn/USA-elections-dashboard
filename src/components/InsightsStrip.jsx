import { computeInsights } from '../lib/insights.js';

function Stat({ value, label }) {
  return (
    <div className="flex-1 min-w-[160px]">
      <div className="text-3xl font-serif font-semibold">{value}</div>
      <div className="text-sm text-ink/60 leading-snug">{label}</div>
    </div>
  );
}

export default function InsightsStrip() {
  const i = computeInsights();
  const regretShare = ((i.regretStateCount / i.trumpStateCount) * 100).toFixed(0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
      <Stat value={i.trumpStateCount} label="states voted for Trump in 2024" />
      <Stat
        value={`${i.regretStateCount} (${regretShare}%)`}
        label="of those states elected a Democratic governor or senator in the 2026 midterms"
      />
      <Stat value={i.doubleRegretStates.length} label="Trump '24 states that did it twice — both Senate and Governor went Democratic in 2026" />
      <Stat value={i.pendingRaceCount} label="2026 races still too close to call as of Nov 8, 2026" />
    </div>
  );
}
