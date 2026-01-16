import React, { useState, useEffect } from "react";
import "./NewTab.css";
import Layout from "./components/Layout";
import JiraSettings from "./components/jira-settings";
import JiraTickets from "./components/jira-tickets";
import CalendarEvents from "./components/calendar-events";
import Settings from "./components/settings";
import useJira from "./components/hooks/useJira";
import useCalendar from "./components/hooks/useCalendar";
import useStorage from "./components/hooks/useStorage";
import { getUserName } from "./components/api/storage";

const NewTab: React.FC = () => {
  const { photo, refreshPhotos } = useStorage();
  const { tickets, loading, error, isConfigured, refetch } = useJira();
  const [userName, setUserName] = useState<string>("");
  const { 
    events: calendarEvents, 
    loading: calendarLoading, 
    error: calendarError, 
    isAuthenticated: calendarConnected,
    connect: connectCalendar,
    disconnect: disconnectCalendar,
  } = useCalendar();
  const [showSettings, setShowSettings] = useState(false);

  // Load user name from storage
  useEffect(() => {
    getUserName().then(setUserName);
  }, []);

  const handleSettingsSave = () => {
    setShowSettings(false);
    refetch();
    // Reload user name in case it was changed
    getUserName().then(setUserName);
  };

  return (
    <div className="App">
      <Layout.Background photo={photo} />
      
      {/* Top right corner - Settings button only */}
      {isConfigured && (
        <div className="top-right-controls">
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
      <div className="branding">
        <img src="icon.png" alt="" className="branding-icon" />
        <span>Relax the Kax</span>
      </div>

      {/* Photo refresh button - bottom left */}
      {photo && (
        <button 
          className="photo-refresh-btn"
          onClick={refreshPhotos}
          title="Get new photos"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      )}

      <div className="main-content">
        <div className="welcome">
          Hello{userName ? `, ${userName}` : ''}!
        </div>
        <Layout.ImageLink photo={photo} />

        {/* Settings Modal */}
        {showSettings && (
          <div className="settings-overlay" onClick={() => setShowSettings(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <Settings
                onClose={() => setShowSettings(false)}
                onSave={handleSettingsSave}
                isJiraConfigured={isConfigured}
                calendarConnected={calendarConnected}
                onCalendarConnect={connectCalendar}
                onCalendarDisconnect={disconnectCalendar}
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
            {/* Calendar connect option even without Jira */}
            <CalendarEvents
              events={calendarEvents}
              loading={calendarLoading}
              error={calendarError || undefined}
              isAuthenticated={calendarConnected}
              onConnect={connectCalendar}
            />
          </div>
        ) : (
          !showSettings && (
            <div className="content-panels">
              <div className="tickets-container">
                <JiraTickets 
                  tickets={tickets} 
                  loading={loading} 
                  error={error || undefined}
                />
              </div>
              <div className="calendar-container">
                <CalendarEvents
                  events={calendarEvents}
                  loading={calendarLoading}
                  error={calendarError || undefined}
                  isAuthenticated={calendarConnected}
                  onConnect={connectCalendar}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default NewTab;
