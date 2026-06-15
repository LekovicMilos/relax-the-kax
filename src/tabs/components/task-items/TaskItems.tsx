import React from "react";
import { TaskItem } from "../api/types";
import "../jira-tickets/JiraTickets.css";
import "./TaskItems.css";

export type TaskAccent = "trello" | "notion" | "linear";

interface TaskItemsProps {
  title: string;
  icon: React.ReactNode;
  accent: TaskAccent;
  items: TaskItem[];
  loading?: boolean;
  error?: string;
  emptyLabel?: string;
}

const TaskItems: React.FC<TaskItemsProps> = ({
  title,
  icon,
  accent,
  items,
  loading,
  error,
  emptyLabel = "Nothing here",
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
          <p>{emptyLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jira-tickets-wrapper">
      <div className={`jira-section task-section task-section-${accent}`}>
        <div className="jira-section-header">
          <span className="jira-section-icon task-section-icon">{icon}</span>
          <h3>{title}</h3>
          <span className={`jira-count task-count-${accent}`}>{items.length}</span>
        </div>
        <div className="jira-tickets-list">
          {items.map((item) => (
            <Card key={item.id} item={item} accent={accent} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{ item: TaskItem; accent: TaskAccent }> = ({ item, accent }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`jira-ticket-card task-ticket-card task-ticket-card-${accent}`}
  >
    <div className="jira-ticket-key">
      {item.icon && <span className="jira-type">{item.icon}</span>}
      {item.subtitle && <span className="jira-key-text">{item.subtitle}</span>}
    </div>
    <div className="jira-ticket-summary">{item.title}</div>
    {item.badge && (
      <div className="jira-ticket-status">
        <span className={`status-badge ${item.badgeClass || ""}`}>{item.badge}</span>
      </div>
    )}
  </a>
);

export default TaskItems;
