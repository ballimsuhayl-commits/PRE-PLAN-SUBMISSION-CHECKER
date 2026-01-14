import React, { useState } from 'react';
import { TabView, PackPreview } from './types';
import { DataView } from './components/Views/DataView';
import { VisualView } from './components/Views/VisualView';
import { FinanceView } from './components/Views/FinanceView';

const Header: React.FC = () => (
  <div className="h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-blue-500" />
      <div className="font-bold text-blue-400 text-sm tracking-widest">
        UDG <span className="text-white">OS</span> <span className="text-[10px] text-slate-600 ml-1">PRO</span>
      </div>
    </div>
    <div className="text-[10px] text-green-500 font-mono">● SYSTEM ACTIVE</div>
  </div>
);

const Tabs: React.FC<{active: TabView; onChange: (t: TabView) => void; disabled?: boolean}> = ({ active, onChange, disabled }) => (
  <div className="flex border-b border-slate-800 bg-slate-900/50">
    {[
      { key: TabView.DATA, label: 'DATA', icon: 'fa-database' },
      { key: TabView.VISUAL, label: 'SITE', icon: 'fa-map' },
      { key: TabView.FINANCE, label: 'YIELD', icon: 'fa-calculator' },
    ].map(t => (
      <button
        key={t.key}
        onClick={() => !disabled && onChange(t.key)}
        className={[
          'flex-1 py-3 text-xs font-bold transition',
          active === t.key ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-500/10' : 'text-slate-500',
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:text-slate-200'
        ].join(' ')}
      >
        <i className={`fa-solid ${t.icon} mr-1`} /> {t.label}
      </button>
    ))}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.DATA);
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [activeConstraint, setActiveConstraint] = useState<string | null>(null);

  const hasPreview = !!preview;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <Header />
      <Tabs active={activeTab} onChange={setActiveTab} disabled={false} />
      <main className="flex-1 overflow-y-auto p-3">
        <div className="max-w-5xl mx-auto space-y-3">
          {activeTab === TabView.DATA && (
            <DataView
              preview={preview}
              onPreview={(p) => { setPreview(p); }}
              onOpenVisual={() => setActiveTab(TabView.VISUAL)}
              onOpenFinance={() => setActiveTab(TabView.FINANCE)}
              onShowConstraint={(key) => { setActiveConstraint(key); setActiveTab(TabView.VISUAL); }}
            />
          )}
          {activeTab === TabView.VISUAL && (
            <VisualView preview={preview} activeConstraint={activeConstraint} />
          )}
          {activeTab === TabView.FINANCE && (
            <FinanceView preview={preview} />
          )}
          {!hasPreview && activeTab !== TabView.DATA && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
              Generate a pack in the DATA tab to enable preview in this section.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
