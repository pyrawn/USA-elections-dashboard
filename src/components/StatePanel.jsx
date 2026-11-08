import { election2024ByAbbr, senate2026ByAbbr, governors2026ByAbbr, candidateBreakdown, partyColor } from '../lib/data.js';

function CandidateBar({ c, totalVotes }) {
  const pct = totalVotes ? (c.votes / totalVotes) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">
          {c.candidate} <span className="text-ink/50 font-normal">({c.party_full})</span>
        </span>
        <span className="tabular-nums text-ink/70">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: partyColor(c.party_group) }} />
      </div>
      <div className="text-xs text-ink/50">{c.votes.toLocaleString('en-US')} votes</div>
    </div>
  );
}

function RaceCandidate({ name, party, isWinner }) {
  return (
    <span style={{ color: partyColor(party) }} className={isWinner ? 'font-semibold' : 'font-normal text-ink/60'}>
      {name} ({party?.[0] ?? '?'})
    </span>
  );
}

function RaceRow({ label, race }) {
  if (!race || race.status === 'no_election_2026') {
    return (
      <div className="text-sm text-ink/50 mb-2">
        {label}: no 2026 election for this office.
      </div>
    );
  }
  if (race.status === 'pending') {
    return (
      <div className="text-sm mb-2">
        <span className="font-medium">{label}:</span> too close to call as of Nov 8, 2026.
        {race.note && <div className="text-xs text-ink/50">{race.note}</div>}
      </div>
    );
  }
  return (
    <div className="text-sm mb-3">
      <div>
        <span className="font-medium">{label}:</span>{' '}
        <RaceCandidate name={race.winner_name} party={race.winner_party} isWinner />
        {race.runner_up_name && (
          <>
            {' '}
            <span className="text-ink/40">def.</span>{' '}
            <RaceCandidate name={race.runner_up_name} party={race.runner_up_party} />
          </>
        )}
      </div>
      <div className="text-xs text-ink/50 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {race.flipped && <span className="rounded-full bg-amber-200 text-amber-900 px-2 py-0.5">flipped</span>}
        {race.margin_pct != null && <span>+{race.margin_pct} pts</span>}
        {!race.runner_up_name && <span>(challenger not confirmed in sourcing)</span>}
      </div>
      {race.regret_signal && (
        <div className="text-xs text-amber-700 mt-0.5">↳ voted Trump in 2024, chose a Democrat here in 2026</div>
      )}
      {race.note && <div className="text-xs text-ink/50 mt-0.5">{race.note}</div>}
    </div>
  );
}

export default function StatePanel({ abbr, mode, onClose }) {
  if (!abbr) {
    return (
      <div className="h-full flex items-center justify-center text-center text-ink/50 text-sm p-6">
        Click any state on the map to see its 2024 candidate results and 2026 check-in.
      </div>
    );
  }

  const state = election2024ByAbbr.get(abbr);
  if (!state) return null;

  const breakdown = candidateBreakdown(state);
  const senate = senate2026ByAbbr.get(abbr);
  const governor = governors2026ByAbbr.get(abbr);
  const isCheckinMode = mode === 'checkin2026';

  const presidentialResults = (
    <>
      {breakdown.map((c) => (
        <CandidateBar key={c.column} c={c} totalVotes={state.total_votes} />
      ))}
    </>
  );

  const checkinResults = (
    <>
      <RaceRow label="Governor" race={governor} />
      <RaceRow label="Senate" race={senate} />
    </>
  );

  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-serif font-semibold">{state.state_name}</h3>
        <button onClick={onClose} className="text-ink/40 hover:text-ink text-sm" aria-label="Close">
          ✕
        </button>
      </div>
      <p className="text-xs text-ink/50 mb-4">
        {state.electoral_votes} electoral votes · {state.total_votes.toLocaleString('en-US')} total votes cast in 2024
      </p>

      {isCheckinMode ? (
        <>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-2">2026 midterm check-in</h4>
          {checkinResults}

          <details className="mt-5 group">
            <summary className="text-xs font-semibold uppercase tracking-wide text-ink/50 cursor-pointer list-none flex items-center gap-1 select-none">
              <span className="inline-block transition-transform group-open:rotate-90">▸</span>
              2024 presidential results
            </summary>
            <div className="mt-2">{presidentialResults}</div>
          </details>
        </>
      ) : (
        <>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-2">2024 presidential results</h4>
          {presidentialResults}

          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 mt-5 mb-2">2026 midterm check-in</h4>
          {checkinResults}
        </>
      )}
    </div>
  );
}
