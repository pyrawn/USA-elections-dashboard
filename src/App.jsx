import { useState } from 'react';
import USMap from './components/USMap.jsx';
import Controls from './components/Controls.jsx';
import Legend from './components/Legend.jsx';
import StatePanel from './components/StatePanel.jsx';
import InsightsStrip from './components/InsightsStrip.jsx';
import { computeInsights } from './lib/insights.js';

export default function App() {
  const [mode, setMode] = useState('party2024');
  const [office, setOffice] = useState('Governor');
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  const insights = computeInsights();

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 md:px-8 py-10">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-widest text-ink/50 mb-2">A 2024 → 2026 story, told with FEC and midterm data</p>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold leading-tight">Did America regret it?</h1>
        <p className="mt-3 max-w-3xl text-ink/70">
          In November 2024, the United States elected Donald Trump president. Two years later, on November 3, 2026,
          voters went back to the polls for the midterms — electing Senators and Governors in most states. This
          dashboard lines the two elections up, state by state, to ask a simple question: where the country voted
          Republican in 2024, did it vote the same way again in 2026, or did it change its mind?
        </p>
      </header>

      <InsightsStrip />

      <section className="mt-4 bg-white/60 rounded-2xl border border-ink/10 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <Controls mode={mode} setMode={setMode} office={office} setOffice={setOffice} />
          <Legend mode={mode} />
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-4">
          <div className="bg-paper rounded-xl border border-ink/10 p-2">
            <USMap mode={mode} office={office} selected={selected} onSelect={setSelected} onHover={setHovered} />
          </div>
          <div className="bg-white rounded-xl border border-ink/10 min-h-[320px]">
            <StatePanel abbr={selected ?? hovered} mode={mode} onClose={() => setSelected(null)} />
          </div>
        </div>
      </section>

      <section className="mt-8 grid md:grid-cols-2 gap-6 text-sm text-ink/70">
        <div>
          <h2 className="font-serif text-lg text-ink font-semibold mb-2">Reading the map</h2>
          <p>
            Switch to <strong>2026 Midterm Check-in</strong> and states outlined in gold are the ones that voted for
            Trump in 2024 but elected a Democratic governor or senator in 2026 — our proxy for "buyer's remorse."
            {' '}
            {insights.regretStates.length > 0 && (
              <>It happened in {insights.regretStateCount} states, including {insights.doubleRegretStates.join(', ') || insights.regretStates.slice(0, 3).join(', ')}.</>
            )}
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink font-semibold mb-2">A caveat worth repeating</h2>
          <p>
            The 2026 results here were gathered five days after election day and reflect media-projected winners,
            not official certified totals — two races were still too close to call at the time of writing. A single
            midterm also isn't a referendum on everything that happened in 2024; it's one data point, not a verdict.
            See <code className="bg-ink/5 px-1 rounded">docs/DATA_DICTIONARY.md</code> for full sourcing and caveats.
          </p>
        </div>
      </section>

      <footer className="mt-10 pt-6 border-t border-ink/10 text-xs text-ink/40">
        Sources: U.S. Federal Election Commission, "2024 Official Presidential General Election Results" (published
        2025-01-16); Wikipedia, "2026 United States Senate elections" and "2026 United States gubernatorial
        elections" (accessed 2026-11-08); The Green Papers, 2024 presidential candidate list. Built with React, D3
        and TopoJSON.
      </footer>
    </div>
  );
}
