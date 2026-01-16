import React, { useState, useEffect } from "react";
import { 
  saveJiraCredentials, 
  getJiraCredentials, 
  clearJiraCredentials, 
  isValidJiraDomain,
  saveJiraStatusPreferences,
  getJiraStatusPreferences,
  JIRA_STATUS_OPTIONS
} from "../api/storage";
import "./JiraSettings.css";

interface JiraSettingsProps {
  onSave?: () => void;
  onClose?: () => void;
  isConfigured: boolean;
}

const JiraSettings: React.FC<JiraSettingsProps> = ({ onSave, onClose, isConfigured }) => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [domain, setDomain] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["in_progress"]);

  useEffect(() => {
    loadCredentials();
    loadStatusPreferences();
  }, []);

  const loadCredentials = async () => {
    const creds = await getJiraCredentials();
    if (creds.jira_email) setEmail(creds.jira_email);
    if (creds.jira_domain) setDomain(creds.jira_domain);
    // Don't load token for security - show placeholder
    if (creds.jira_token) setToken("••••••••••••••••");
  };

  const loadStatusPreferences = async () => {
    const statuses = await getJiraStatusPreferences();
    setSelectedStatuses(statuses);
  };

  const handleStatusToggle = (statusId: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusId)) {
        // Don't allow unchecking all statuses
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== statusId);
      }
      return [...prev, statusId];
    });
  };

  const validateDomain = (value: string) => {
    if (value && !isValidJiraDomain(value)) {
      setDomainError(true);
    } else {
      setDomainError(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    
    // Only save if token doesn't look like the placeholder
    const tokenToSave = token === "••••••••••••••••" ? "" : token;
    
    if (!email || !domain) {
      setError("Please fill in email and domain");
      return;
    }

    // Validate domain format
    if (!isValidJiraDomain(domain)) {
      setError("Invalid Jira domain. Use format: company.atlassian.net");
      setDomainError(true);
      return;
    }

    // If token is placeholder, get existing token
    let finalToken = tokenToSave;
    if (!finalToken) {
      const existingCreds = await getJiraCredentials();
      finalToken = existingCreds.jira_token;
    }

    if (!finalToken) {
      setError("Please enter your API token");
      return;
    }

    const result = await saveJiraCredentials(email, finalToken, domain);
    
    if (!result.success) {
      setError(result.error || "Failed to save");
      return;
    }

    // Save status preferences
    await saveJiraStatusPreferences(selectedStatuses);
    
    setIsSaved(true);
    
    setTimeout(() => {
      setIsSaved(false);
      if (onSave) {
        onSave();
      }
    }, 1500);
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect from Jira? Your credentials will be removed.")) {
      await clearJiraCredentials();
      setEmail("");
      setToken("");
      setDomain("");
      if (onSave) {
        onSave();
      }
    }
  };

  return (
    <div className="jira-settings">
      {/* Close button for modal */}
      {isConfigured && onClose && (
        <button className="jira-close-btn" onClick={onClose}>
          ✕
        </button>
      )}
      
      <h3 className="jira-settings-title">
        {isConfigured ? "Jira Settings" : "Connect to Jira"}
      </h3>
      <p className="jira-settings-description">
        Enter your Jira credentials to see your In Progress tickets.
        <br />
        <a 
          href="https://id.atlassian.com/manage-profile/security/api-tokens" 
          target="_blank"
          rel="noopener noreferrer"
          className="jira-help-link"
        >
          Get your API token here →
        </a>
      </p>
      
      <div className="jira-form">
        <div className="jira-input-group">
          <label htmlFor="jira-domain">Jira Domain</label>
          <input
            id="jira-domain"
            type="text"
            placeholder="your-company.atlassian.net"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              validateDomain(e.target.value);
            }}
            className={`jira-input ${domainError ? 'jira-input-error' : ''}`}
          />
          {domainError && (
            <span className="jira-field-error">
              Use format: company.atlassian.net
            </span>
          )}
        </div>
        
        <div className="jira-input-group">
          <label htmlFor="jira-email">Email</label>
          <input
            id="jira-email"
            type="email"
            placeholder="your.email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="jira-input"
          />
        </div>
        
        <div className="jira-input-group">
          <label htmlFor="jira-token">API Token</label>
          <input
            id="jira-token"
            type="password"
            placeholder="Your Jira API token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onFocus={() => {
              if (token === "••••••••••••••••") setToken("");
            }}
            className="jira-input"
          />
        </div>

        {/* Status Selection */}
        <div className="jira-input-group">
          <label>Show tickets with status:</label>
          <div className="jira-status-checkboxes">
            {JIRA_STATUS_OPTIONS.map(status => (
              <label key={status.id} className="jira-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status.id)}
                  onChange={() => handleStatusToggle(status.id)}
                  className="jira-checkbox"
                />
                <span className="jira-checkbox-text">{status.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="jira-error-message">
            ⚠️ {error}
          </div>
        )}
        
        <div className="jira-buttons">
          <button onClick={handleSave} className="jira-save-btn">
            Save
          </button>
          {isConfigured && (
            <button onClick={handleDisconnect} className="jira-disconnect-btn">
              Disconnect
            </button>
          )}
        </div>
        
        {isSaved && (
          <p className="jira-success">✓ Saved!</p>
        )}
      </div>
    </div>
  );
};

export default JiraSettings;
