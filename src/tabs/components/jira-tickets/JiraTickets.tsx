import React from "react";
import { JiraTicket } from "../api/jira";
import "./JiraTickets.css";

interface JiraTicketsProps {
  tickets: JiraTicket[];
  todoTickets?: JiraTicket[];
  loading?: boolean;
  error?: string;
}

const JiraTickets: React.FC<JiraTicketsProps> = ({ tickets, todoTickets = [], loading, error }) => {
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

  // If no In Progress tickets, show first 2 To Do tickets
  const hasInProgress = tickets && tickets.length > 0;
  const showTodoFallback = !hasInProgress && todoTickets && todoTickets.length > 0;

  if (!hasInProgress && !showTodoFallback) {
    return (
      <div className="jira-tickets-container">
        <div className="jira-empty">
          <span>🎉</span>
          <p>No active tickets</p>
        </div>
      </div>
    );
  }

  // Show In Progress if available, otherwise show first 2 To Do
  const displayTickets = hasInProgress ? tickets : todoTickets.slice(0, 2);
  const sectionTitle = hasInProgress ? "In Progress" : "Up Next";
  const sectionIcon = hasInProgress ? "🔥" : "📋";
  const isTodoSection = !hasInProgress;

  return (
    <div className="jira-tickets-wrapper">
      <div className={`jira-section ${isTodoSection ? 'jira-section-todo' : 'jira-section-progress'}`}>
        <div className="jira-section-header">
          <span className="jira-section-icon">{sectionIcon}</span>
          <h3>{sectionTitle}</h3>
          <span className={`jira-count ${isTodoSection ? 'jira-count-todo' : ''}`}>
            {displayTickets.length}
          </span>
        </div>
        <div className="jira-tickets-list">
          {displayTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} isTodo={isTodoSection} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Individual ticket card component
const TicketCard: React.FC<{ ticket: JiraTicket; isTodo?: boolean }> = ({ ticket, isTodo }) => {
  return (
    <a
      href={ticket.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`jira-ticket-card ${isTodo ? 'ticket-todo' : ''}`}
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
        <span className={`status-badge ${isTodo ? 'status-todo' : ''}`}>
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
