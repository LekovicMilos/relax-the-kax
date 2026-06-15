import React, { useState } from "react";
import { FeedItem, FeedSource } from "../api/feed";
import "../jira-tickets/JiraTickets.css";
import "./MyDay.css";

interface MyDayProps {
  items: FeedItem[];
  icons: Record<FeedSource, React.ReactNode>;
  loading?: boolean;
  /** How many items to show before the "show more" toggle. */
  limit?: number;
}

const MyDay: React.FC<MyDayProps> = ({ items, icons, loading, limit = 8 }) => {
  const [expanded, setExpanded] = useState(false);

  if (loading && items.length === 0) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-loading">
          <div className="jira-spinner"></div>
          <span>Loading your day...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-empty">
          <span>🎉</span>
          <p>All clear for today</p>
        </div>
      </div>
    );
  }

  const visible = expanded ? items : items.slice(0, limit);
  const hidden = items.length - visible.length;

  return (
    <div className="jira-tickets-wrapper myday-wrapper">
      <div className="jira-section myday-section">
        <div className="jira-section-header">
          <span className="jira-section-icon">☀️</span>
          <h3>My Day</h3>
          <span className="jira-count">{items.length}</span>
        </div>
        <div className="jira-tickets-list myday-list">
          {visible.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="myday-row"
            >
              <span className="myday-row-icon" title={item.source}>
                {icons[item.source]}
              </span>
              <span className="myday-row-body">
                {item.meta && <span className="myday-row-meta">{item.meta}</span>}
                <span className="myday-row-title">{item.title}</span>
              </span>
              {item.badge && (
                <span className={`status-badge ${item.badgeClass || ""}`}>
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </div>
        {(hidden > 0 || expanded) && items.length > limit && (
          <button
            className="myday-more-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : `+ ${hidden} more`}
          </button>
        )}
      </div>
    </div>
  );
};

export default MyDay;
