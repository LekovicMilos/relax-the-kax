import React, { useState, useEffect } from "react";
import {
  saveGitlabCredentials,
  getGitlabCredentials,
  clearGitlabCredentials,
  DEFAULT_GITLAB_DOMAIN,
} from "../api/storage";
import "../jira-settings/JiraSettings.css";

interface GitlabSettingsProps {
  onSave?: () => void;
  isConfigured: boolean;
}

const TOKEN_PLACEHOLDER = "••••••••••••••••";

const GitlabSettings: React.FC<GitlabSettingsProps> = ({ onSave, isConfigured }) => {
  const [token, setToken] = useState("");
  const [domain, setDomain] = useState(DEFAULT_GITLAB_DOMAIN);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGitlabCredentials().then((creds) => {
      if (creds.gitlab_domain) setDomain(creds.gitlab_domain);
      if (creds.gitlab_token) setToken(TOKEN_PLACEHOLDER);
    });
  }, []);

  const handleSave = async () => {
    setError(null);

    let finalToken = token === TOKEN_PLACEHOLDER ? "" : token;
    if (!finalToken) {
      const existing = await getGitlabCredentials();
      finalToken = existing.gitlab_token;
    }

    if (!finalToken) {
      setError("Please enter your GitLab token");
      return;
    }

    const result = await saveGitlabCredentials(finalToken, domain || DEFAULT_GITLAB_DOMAIN);
    if (!result.success) {
      setError(result.error || "Failed to save");
      return;
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSave?.();
    }, 1500);
  };

  const handleDisconnect = async () => {
    if (confirm("Disconnect GitLab? Your token will be removed.")) {
      await clearGitlabCredentials();
      setToken("");
      setDomain(DEFAULT_GITLAB_DOMAIN);
      onSave?.();
    }
  };

  return (
    <div className="jira-settings jira-settings-embedded">
      <p className="jira-settings-description">
        Create a token with the <strong>read_api</strong> scope. Use gitlab.com or
        your self-hosted host.
        <br />
        <a
          href="https://gitlab.com/-/user_settings/personal_access_tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="jira-help-link"
        >
          Get your GitLab token here →
        </a>
      </p>

      <div className="jira-form">
        <div className="jira-input-group">
          <label htmlFor="gitlab-domain">GitLab Host</label>
          <input
            id="gitlab-domain"
            type="text"
            placeholder="gitlab.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="jira-input"
          />
        </div>

        <div className="jira-input-group">
          <label htmlFor="gitlab-token">Personal Access Token</label>
          <input
            id="gitlab-token"
            type="password"
            placeholder="glpat-..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onFocus={() => {
              if (token === TOKEN_PLACEHOLDER) setToken("");
            }}
            className="jira-input"
          />
        </div>

        {error && <div className="jira-error-message">⚠️ {error}</div>}

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

        {isSaved && <p className="jira-success">✓ Saved!</p>}
      </div>
    </div>
  );
};

export default GitlabSettings;
