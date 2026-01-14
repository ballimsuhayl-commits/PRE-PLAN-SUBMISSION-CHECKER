import React, { useState } from "react";
import DataView from "./components/Views/DataView";

export default function App() {
  const [tab, setTab] = useState<"data" | "site" | "yield">("data");

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="dot" />
          <div className="title">UDG OS <span className="muted">PRO</span></div>
        </div>
        <div className="status">● SYSTEM ACTIVE</div>
      </header>

      <nav className="tabs">
        <button className={tab === "data" ? "tab active" : "tab"} onClick={() => setTab("data")}>DATA</button>
        <button className={tab === "site" ? "tab active" : "tab"} onClick={() => setTab("site")}>SITE</button>
        <button className={tab === "yield" ? "tab active" : "tab"} onClick={() => setTab("yield")}>YIELD</button>
      </nav>

      <main className="content">
        {tab === "data" && <DataView />}
        {tab !== "data" && (
          <div className="card">
            <div className="h">Next modules</div>
            <div className="p">SITE: parcel polygon + overlays. YIELD: feasibility. DATA is already wired and working.</div>
          </div>
        )}
      </main>
    </div>
  );
}
