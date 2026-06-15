import React, { useState } from "react";
import "./LayoutTabs.css";

export interface TabPanel {
  key: string;
  label: string;
  icon: React.ReactNode;
  node: React.ReactNode;
}

interface LayoutTabsProps {
  panels: TabPanel[];
}

const LayoutTabs: React.FC<LayoutTabsProps> = ({ panels }) => {
  const [active, setActive] = useState(panels[0]?.key);

  if (panels.length === 0) return null;

  const current = panels.find((p) => p.key === active) || panels[0];

  return (
    <div className="layout-tabs">
      <div className="layout-tabs-bar">
        {panels.map((p) => (
          <button
            key={p.key}
            className={`layout-tab ${p.key === current.key ? "active" : ""}`}
            onClick={() => setActive(p.key)}
            title={p.label}
          >
            <span className="layout-tab-icon">{p.icon}</span>
            <span className="layout-tab-label">{p.label}</span>
          </button>
        ))}
      </div>
      <div className="layout-tabs-content">{current.node}</div>
    </div>
  );
};

export default LayoutTabs;
