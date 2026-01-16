import React, { useState, useEffect } from "react";
import "./Settings.css";
import JiraSettings from "../jira-settings/JiraSettings";
import { getUserName, saveUserName } from "../api/storage";

interface SettingsProps {
  onClose: () => void;
  onSave: () => void;
  // Jira
  isJiraConfigured: boolean;
  // Calendar
  calendarConnected: boolean;
  onCalendarConnect: () => void;
  onCalendarDisconnect: () => void;
}

type SettingsTab = "overview" | "jira" | "calendar";

const Settings: React.FC<SettingsProps> = ({
  onClose,
  onSave,
  isJiraConfigured,
  calendarConnected,
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
