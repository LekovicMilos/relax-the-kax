import React from "react";
import { JiraTicket } from "../api/jira";
import "./JiraTickets.css";

interface JiraTicketsProps {
  tickets: JiraTicket[];
  loading?: boolean;
  error?: string;
}

const JiraTickets: React.FC<JiraTicketsProps> = ({ tickets, loading, error }) => {
  if (loading) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-loading">
          <div className="jira-spinner"></div>
          <span>Loading tickets...</span>
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

  if (!tickets || tickets.length === 0) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-empty">
          <span>🎉</span>
          <p>No tickets found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jira-tickets-wrapper">
      <div className="jira-section jira-section-progress">
        <div className="jira-section-header">
          <span className="jira-section-icon">📋</span>
          <h3>My Tickets</h3>
          <span className="jira-count">{tickets.length}</span>
        </div>
        <div className="jira-tickets-list">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Individual ticket card component
const TicketCard: React.FC<{ ticket: JiraTicket }> = ({ ticket }) => {
  // Determine status color based on status category
  const getStatusClass = () => {
    const status = ticket.status.toLowerCase();
    const category = ticket.statusCategory?.toLowerCase() || "";
    
    if (category === "done" || status === "done") return "status-done";
    if (category === "in progress" || status.includes("progress") || status.includes("review")) return "status-progress";
    if (status === "blocked") return "status-blocked";
    return "status-todo";
  };

  return (
    <a
      href={ticket.url}
      target="_blank"
      rel="noopener noreferrer"
      className="jira-ticket-card"
    >
      <div className="jira-ticket-key">
        {ticket.issueType && (
          <span className="jira-type">
            {getIssueTypeIcon(ticket.issueType)}
          </span>
        )}
        <span className="jira-key-text">{ticket.key}</span>
        {ticket.priority && (
          <span className="jira-priority-dot">
            {getPriorityIcon(ticket.priority)}
          </span>
        )}
      </div>
      <div className="jira-ticket-summary">{ticket.summary}</div>
      <div className="jira-ticket-status">
        <span className={`status-badge ${getStatusClass()}`}>
          {ticket.status}
        </span>
      </div>
    </a>
  );
};

const getIssueTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'bug': '🐛',
    'story': '📖',
    'task': '✅',
    'epic': '⚡',
    'subtask': '📌',
    'sub-task': '📌',
  };
  return icons[type.toLowerCase()] || '📄';
};

const getPriorityIcon = (priority: string): string => {
  const icons: Record<string, string> = {
    'highest': '🔴',
    'high': '🟠',
    'medium': '🟡',
    'low': '🟢',
    'lowest': '🔵',
  };
  return icons[priority.toLowerCase()] || '';
};

export default JiraTickets;
