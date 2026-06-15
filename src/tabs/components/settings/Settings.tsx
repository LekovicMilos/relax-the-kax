import React, { useState, useEffect } from "react";
import "./Settings.css";
import JiraSettings from "../jira-settings/JiraSettings";
import GithubSettings from "../github-settings/GithubSettings";
import GitlabSettings from "../gitlab-settings/GitlabSettings";
import TrelloSettings from "../service-settings/TrelloSettings";
import NotionSettings from "../service-settings/NotionSettings";
import LinearSettings from "../service-settings/LinearSettings";
import { getUserName, saveUserName, LayoutMode } from "../api/storage";

interface SettingsProps {
  onClose: () => void;
  onSave: () => void;
  // Layout
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  // Jira
  isJiraConfigured: boolean;
  // GitHub
  isGithubConfigured: boolean;
  // GitLab
  isGitlabConfigured: boolean;
  // Trello
  isTrelloConfigured: boolean;
  // Notion
  isNotionConfigured: boolean;
  // Linear
  isLinearConfigured: boolean;
  // Calendar
  calendarConnected: boolean;
  calendarError?: string;
  onCalendarConnect: () => void;
  onCalendarDisconnect: () => void;
}

type SettingsTab =
  | "overview"
  | "jira"
  | "github"
  | "gitlab"
  | "trello"
  | "notion"
  | "linear"
  | "calendar";

const LAYOUT_OPTIONS: { id: LayoutMode; label: string; hint: string }[] = [
  { id: "myday", label: "My Day", hint: "Everything in one list" },
  { id: "boards", label: "Boards", hint: "One panel per service" },
  { id: "tabs", label: "Tabs", hint: "One box, switch by tab" },
];

const Settings: React.FC<SettingsProps> = ({
  onClose,
  onSave,
  layoutMode,
  onLayoutChange,
  isJiraConfigured,
  isGithubConfigured,
  isGitlabConfigured,
  isTrelloConfigured,
  isNotionConfigured,
  isLinearConfigured,
  calendarConnected,
  calendarError,
  onCalendarConnect,
  onCalendarDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("overview");
  const [userName, setUserName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    getUserName().then(setUserName);
  }, []);

  const handleNameSave = async () => {
    await saveUserName(userName);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 1500);
    onSave(); // Trigger refresh in parent
  };

  const handleJiraSave = () => {
    onSave();
    setActiveTab("overview");
  };

  const handleServiceSave = () => {
    onSave();
    setActiveTab("overview");
  };

  return (
    <div className="settings-popup">
      {/* Header */}
      <div className="settings-header">
        {activeTab !== "overview" && (
          <button className="settings-back-btn" onClick={() => setActiveTab("overview")}>
            ←
          </button>
        )}
        <h2 className="settings-title">
          {activeTab === "overview" && "Settings"}
          {activeTab === "jira" && "Jira Settings"}
          {activeTab === "github" && "GitHub Settings"}
          {activeTab === "gitlab" && "GitLab Settings"}
          {activeTab === "trello" && "Trello Settings"}
          {activeTab === "notion" && "Notion Settings"}
          {activeTab === "linear" && "Linear Settings"}
          {activeTab === "calendar" && "Calendar Settings"}
        </h2>
        <button className="settings-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {activeTab === "overview" && (
          <div className="settings-overview">
            {/* User Name Section */}
            <div className="settings-name-section">
              <label htmlFor="user-name">Your Name</label>
              <div className="settings-name-input-row">
                <input
                  id="user-name"
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="settings-name-input"
                />
                <button 
                  onClick={handleNameSave} 
                  className="settings-name-save-btn"
                  disabled={nameSaved}
                >
                  {nameSaved ? '✓' : 'Save'}
                </button>
              </div>
            </div>

            <div className="settings-divider"></div>

            {/* Layout Section */}
            <div className="settings-layout-section">
              <label>Layout</label>
              <div className="settings-layout-options">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`settings-layout-btn ${layoutMode === opt.id ? "active" : ""}`}
                    onClick={() => onLayoutChange(opt.id)}
                    title={opt.hint}
                  >
                    <span className="settings-layout-btn-label">{opt.label}</span>
                    <span className="settings-layout-btn-hint">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-divider"></div>

            {/* Jira Section */}
            <div 
              className={`settings-service-card ${isJiraConfigured ? 'connected' : ''}`}
              onClick={() => setActiveTab("jira")}
            >
              <div className="service-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z"/>
                </svg>
              </div>
              <div className="service-info">
                <h3>Jira</h3>
                <span className={`service-status ${isJiraConfigured ? 'status-connected' : 'status-disconnected'}`}>
                  {isJiraConfigured ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <div className="service-arrow">→</div>
            </div>

            {/* GitHub Section */}
            <div
              className={`settings-service-card ${isGithubConfigured ? 'connected' : ''}`}
              onClick={() => setActiveTab("github")}
            >
              <div className="service-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </div>
              <div className="service-info">
                <h3>GitHub</h3>
                <span className={`service-status ${isGithubConfigured ? 'status-connected' : 'status-disconnected'}`}>
                  {isGithubConfigured ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <div className="service-arrow">→</div>
            </div>

            {/* GitLab Section */}
            <div
              className={`settings-service-card ${isGitlabConfigured ? 'connected' : ''}`}
              onClick={() => setActiveTab("gitlab")}
            >
              <div className="service-icon">
                <svg viewBox="0 0 24 24" fill="#FC6D26">
                  <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.919 1.263a.455.455 0 0 0-.867 0L1.388 9.452.046 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.623-8.443a.924.924 0 0 0 .332-1.024"/>
                </svg>
              </div>
              <div className="service-info">
                <h3>GitLab</h3>
                <span className={`service-status ${isGitlabConfigured ? 'status-connected' : 'status-disconnected'}`}>
                  {isGitlabConfigured ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <div className="service-arrow">→</div>
            </div>

            {/* Trello Section */}
            <div
              className={`settings-service-card ${isTrelloConfigured ? 'connected' : ''}`}
              onClick={() => setActiveTab("trello")}
            >
              <div className="service-icon">
                <svg viewBox="0 0 24 24" fill="#0079BF">
                  <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v12.36zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V5.82c0-.795.646-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v6.36z"/>
                </svg>
              </div>
              <div className="service-info">
                <h3>Trello</h3>
                <span className={`service-status ${isTrelloConfigured ? 'status-connected' : 'status-disconnected'}`}>
                  {isTrelloConfigured ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <div className="service-arrow">→</div>
            </div>

            {/* Notion Section */}
            <div
              className={`settings-service-card ${isNotionConfigured ? 'connected' : ''}`}
              onClick={() => setActiveTab("notion")}
            >
              <div className="service-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.216-1.632z"/>
                </svg>
              </div>
              <div className="service-info">
                <h3>Notion</h3>
                <span className={`service-status ${isNotionConfigured ? 'status-connected' : 'status-disconnected'}`}>
                  {isNotionConfigured ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <div className="service-arrow">→</div>
            </div>

            {/* Linear Section */}
            <div
              className={`settings-service-card ${isLinearConfigured ? 'connected' : ''}`}
              onClick={() => setActiveTab("linear")}
            >
              <div className="service-icon">
                <svg viewBox="0 0 24 24" fill="#5E6AD2">
                  <path d="M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.01c0 3.6-1.584 6.83-4.094 9.03L2.886 4.18zM1.06 6.62L17.38 22.94a11.953 11.953 0 0 1-3.04 .912L.148 9.66c.198-1.07.51-2.094.912-3.04zM.002 12.762l11.236 11.236c-.71-.046-1.404-.15-2.077-.31L.312 14.84a11.96 11.96 0 0 1-.31-2.078zM.74 17.5l5.76 5.76a12.04 12.04 0 0 1-5.76-5.76z"/>
                </svg>
              </div>
              <div className="service-info">
                <h3>Linear</h3>
                <span className={`service-status ${isLinearConfigured ? 'status-connected' : 'status-disconnected'}`}>
                  {isLinearConfigured ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <div className="service-arrow">→</div>
            </div>

            {/* Calendar Section */}
            <div
              className={`settings-service-card ${calendarConnected ? 'connected' : ''}`}
              onClick={() => setActiveTab("calendar")}
            >
              <div className="service-icon calendar-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                </svg>
              </div>
              <div className="service-info">
                <h3>Google Calendar</h3>
                <span className={`service-status ${calendarConnected ? 'status-connected' : 'status-disconnected'}`}>
                  {calendarConnected ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <div className="service-arrow">→</div>
            </div>
          </div>
        )}

        {activeTab === "jira" && (
          <div className="settings-section">
            <JiraSettings
              isConfigured={isJiraConfigured}
              onSave={handleJiraSave}
              embedded={true}
            />
          </div>
        )}

        {activeTab === "github" && (
          <div className="settings-section">
            <GithubSettings
              isConfigured={isGithubConfigured}
              onSave={handleServiceSave}
            />
          </div>
        )}

        {activeTab === "gitlab" && (
          <div className="settings-section">
            <GitlabSettings
              isConfigured={isGitlabConfigured}
              onSave={handleServiceSave}
            />
          </div>
        )}

        {activeTab === "trello" && (
          <div className="settings-section">
            <TrelloSettings
              isConfigured={isTrelloConfigured}
              onSave={handleServiceSave}
            />
          </div>
        )}

        {activeTab === "notion" && (
          <div className="settings-section">
            <NotionSettings
              isConfigured={isNotionConfigured}
              onSave={handleServiceSave}
            />
          </div>
        )}

        {activeTab === "linear" && (
          <div className="settings-section">
            <LinearSettings
              isConfigured={isLinearConfigured}
              onSave={handleServiceSave}
            />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="settings-section">
            <div className="calendar-settings">
              <div className="calendar-settings-status">
                {calendarConnected ? (
                  <>
                    <div className="calendar-connected-info">
                      <span className="calendar-connected-icon">✓</span>
                      <span>Google Calendar is connected</span>
                    </div>
                    <p className="calendar-settings-desc">
                      Your today's events will be displayed on the new tab page.
                    </p>
                    <button 
                      className="calendar-disconnect-btn"
                      onClick={onCalendarDisconnect}
                    >
                      Disconnect Google Calendar
                    </button>
                  </>
                ) : (
                  <>
                    <p className="calendar-settings-desc">
                      Connect your Google Calendar to see today's events on your new tab page.
                    </p>
                    {calendarError && (
                      <div className="jira-error-message">⚠️ {calendarError}</div>
                    )}
                    <button
                      className="calendar-connect-btn"
                      onClick={onCalendarConnect}
                    >
                      <svg className="google-icon" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Connect Google Calendar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
