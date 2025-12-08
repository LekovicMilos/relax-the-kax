import React, { useState } from "react";
import "./NewTab.css";
import Layout from "./components/Layout";
import JiraSettings from "./components/jira-settings";
import JiraTickets from "./components/jira-tickets";
import useJira from "./components/hooks/useJira";
import useStorage from "./components/hooks/useStorage";

const NewTab: React.FC = () => {
  const { photo } = useStorage();
  const { tickets, todoTickets, loading, error, isConfigured, userName, refetch } = useJira();
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsSave = () => {
    setShowSettings(false);
    refetch();
  };

  return (
    <div className="App">
      <Layout.Background photo={photo} />
      
      {/* Top right corner - Jira indicator + Settings */}
      {isConfigured && (
        <div className="top-right-controls">
          <div className="jira-status-indicator">
            <svg className="jira-logo" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z"/>
            </svg>
            <span className="jira-check">✓</span>
          </div>
          
          <button 
            className="settings-button"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Branding */}
      <div className="branding">Relax the Kax</div>

      <div className="main-content">
        <div className="welcome">
          Hello{userName ? `, ${userName}` : ''}!
        </div>
        <Layout.ImageLink photo={photo} />

        {/* Settings Modal */}
        {showSettings && (
          <div className="settings-overlay" onClick={() => setShowSettings(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <JiraSettings 
                isConfigured={isConfigured} 
                onSave={handleSettingsSave}
                onClose={() => setShowSettings(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isConfigured ? (
          <div className="setup-container">
            <h1 className="setup-title">Welcome!</h1>
            <p className="setup-description">
              Connect your Jira to see your in-progress tickets
            </p>
            <JiraSettings 
              isConfigured={false} 
              onSave={handleSettingsSave}
            />
          </div>
        ) : (
          !showSettings && (
            <div className="tickets-container">
              <JiraTickets 
                tickets={tickets} 
                todoTickets={todoTickets}
                loading={loading} 
                error={error || undefined}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default NewTab;
