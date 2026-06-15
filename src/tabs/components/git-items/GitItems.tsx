import React from "react";
import { GitItem } from "../api/github";
import "../jira-tickets/JiraTickets.css";
import "./GitItems.css";

interface GitItemsProps {
  title: string;
  icon: React.ReactNode;
  accent: "github" | "gitlab";
  items: GitItem[];
  loading?: boolean;
  error?: string;
}

const GitItems: React.FC<GitItemsProps> = ({
  title,
  icon,
  accent,
  items,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-loading">
          <div className="jira-spinner"></div>
          <span>Loading {title}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-error">
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-empty">
          <span>🎉</span>
          <p>Nothing assigned</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jira-tickets-wrapper">
      <div className={`jira-section git-section git-section-${accent}`}>
        <div className="jira-section-header">
          <span className="jira-section-icon git-section-icon">{icon}</span>
          <h3>{title}</h3>
          <span className={`jira-count git-count-${accent}`}>{items.length}</span>
        </div>
        <div className="jira-tickets-list">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} accent={accent} />
          ))}
        </div>
      </div>
    </div>
  );
};

const ItemCard: React.FC<{ item: GitItem; accent: "github" | "gitlab" }> = ({
  item,
  accent,
}) => {
  const refSymbol = item.type === "issue" ? "#" : item.type === "mr" ? "!" : "#";
  const typeIcon =
    item.type === "issue" ? "🐛" : item.draft ? "📝" : item.reviewRequested ? "👀" : "🔀";

  const getStatusClass = () => {
    if (item.draft) return "status-todo";
    if (item.reviewRequested) return "status-progress";
    return "status-progress";
  };

  const statusLabel = item.draft
    ? "Draft"
    : item.reviewRequested
    ? "Review requested"
    : item.type === "issue"
    ? "Issue"
    : item.type === "mr"
    ? "Merge request"
    : "Pull request";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`jira-ticket-card git-ticket-card git-ticket-card-${accent}`}
    >
      <div className="jira-ticket-key">
        <span className="jira-type">{typeIcon}</span>
        <span className="jira-key-text">
          {item.repo}
          {item.number ? ` ${refSymbol}${item.number}` : ""}
        </span>
      </div>
      <div className="jira-ticket-summary">{item.title}</div>
      <div className="jira-ticket-status">
        <span className={`status-badge ${getStatusClass()}`}>{statusLabel}</span>
      </div>
    </a>
  );
};

export default GitItems;
