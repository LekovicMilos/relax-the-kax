import React, { useState, useEffect } from "react";
import { saveJiraCredentials, getJiraCredentials } from "../api/storage";
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

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const creds = await getJiraCredentials();
    if (creds.jira_email) setEmail(creds.jira_email);
    if (creds.jira_domain) setDomain(creds.jira_domain);
    // Don't load token for security - show placeholder
    if (creds.jira_token) setToken("••••••••••••••••");
  };

  const handleSave = async () => {
    // Only save if token doesn't look like the placeholder
    const tokenToSave = token === "••••••••••••••••" ? "" : token;
    
    if (!email || !domain) {
      alert("Please fill in email and domain");
      return;
    }

    // If token is placeholder, get existing token
    let finalToken = tokenToSave;
    if (!finalToken) {
      const existingCreds = await getJiraCredentials();
      finalToken = existingCreds.jira_token;
    }

    if (!finalToken) {
      alert("Please enter your API token");
      return;
    }

    await saveJiraCredentials(email, finalToken, domain);
    setIsSaved(true);
    
    setTimeout(() => {
      setIsSaved(false);
      if (onSave) {
        onSave();
      }
    }, 1500);
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
            onChange={(e) => setDomain(e.target.value)}
            className="jira-input"
          />
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
        
        <div className="jira-buttons">
          <button onClick={handleSave} className="jira-save-btn">
            Save
          </button>
        </div>
        
        {isSaved && (
          <p className="jira-success">✓ Saved!</p>
        )}
      </div>
    </div>
  );
};

export default JiraSettings;
