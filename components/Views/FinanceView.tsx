import React, { useMemo, useState } from 'react';
import type { PackPreview } from '../../types';

export const FinanceView: React.FC<{ preview: PackPreview | null }> = ({ preview }) => {
  const [rate, setRate] = useState<number>(25000);
  const [eff, setEff] = useState<number>(0.8);

  const calc = useMemo(() => {
    if (!preview) return null;
    const gfa = preview.metrics.maxGFAM2;
    const nla = gfa * eff;
    const gdv = nla * rate;
    return { gfa, nla, gdv };
  }, [preview, rate, eff]);

  if (!preview) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase">Yield Preview</div>
        <div className="text-[11px] text-slate-400">Derived from the automated envelope results (review before download).</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
          <div className="text-[10px] text-slate-500 uppercase">Rate (R / m² NLA)</div>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-2 w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
          />
        </div>
        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
          <div className="text-[10px] text-slate-500 uppercase">Efficiency (NLA / GFA)</div>
          <input
            type="number"
            step="0.01"
            min="0.3"
            max="0.95"
            value={eff}
            onChange={(e) => setEff(Number(e.target.value))}
            className="mt-2 w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
          />
          <div className="text-[10px] text-slate-500 mt-2">Typical range 0.75–0.85.</div>
        </div>
      </div>

      {calc && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
            <div className="text-[10px] text-slate-500 uppercase">Max GFA</div>
            <div className="text-lg font-bold text-white mt-1">{Math.round(calc.gfa).toLocaleString()} m²</div>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
            <div className="text-[10px] text-slate-500 uppercase">Estimated NLA</div>
            <div className="text-lg font-bold text-white mt-1">{Math.round(calc.nla).toLocaleString()} m²</div>
          </div>
          <div className="rounded-lg bg-emerald-950/30 border border-emerald-600/30 p-3">
            <div className="text-[10px] text-emerald-300 uppercase">Indicative GDV</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">R {Math.round(calc.gdv).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-slate-500">
        This module is intentionally lean. If you want, we can upgrade the backend pack to compute residual land value, TDC, and sensitivity.
      </div>
    </div>
  );
};
