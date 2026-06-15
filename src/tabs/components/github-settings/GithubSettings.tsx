import React, { useState, useEffect } from "react";
import {
  saveGithubCredentials,
  getGithubCredentials,
  clearGithubCredentials,
} from "../api/storage";
import "../jira-settings/JiraSettings.css";

interface GithubSettingsProps {
  onSave?: () => void;
  isConfigured: boolean;
}

const TOKEN_PLACEHOLDER = "••••••••••••••••";

const GithubSettings: React.FC<GithubSettingsProps> = ({ onSave, isConfigured }) => {
  const [token, setToken] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGithubCredentials().then((creds) => {
      if (creds.github_token) setToken(TOKEN_PLACEHOLDER);
    });
  }, []);

  const handleSave = async () => {
    setError(null);

    let finalToken = token === TOKEN_PLACEHOLDER ? "" : token;
    if (!finalToken) {
      const existing = await getGithubCredentials();
      finalToken = existing.github_token;
    }

    if (!finalToken) {
      setError("Please enter your GitHub token");
      return;
    }

    const result = await saveGithubCredentials(finalToken);
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
    if (confirm("Disconnect GitHub? Your token will be removed.")) {
      await clearGithubCredentials();
      setToken("");
      onSave?.();
    }
  };

  return (
    <div className="jira-settings jira-settings-embedded">
      <p className="jira-settings-description">
        Create a token with <strong>repo</strong> scope (classic) or read access to
        issues &amp; pull requests (fine-grained).
        <br />
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="jira-help-link"
        >
          Get your GitHub token here →
        </a>
      </p>

      <div className="jira-form">
        <div className="jira-input-group">
          <label htmlFor="github-token">Personal Access Token</label>
          <input
            id="github-token"
            type="password"
            placeholder="ghp_..."
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

export default GithubSettings;
