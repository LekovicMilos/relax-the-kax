import React, { useState, useEffect } from "react";
import "./NewTab.css";
import Layout from "./components/Layout";
import JiraTickets from "./components/jira-tickets";
import GitItems from "./components/git-items";
import TaskItems from "./components/task-items";
import CalendarEvents from "./components/calendar-events";
import MyDay from "./components/my-day";
import LayoutTabs, { TabPanel } from "./components/layout-tabs";
import Settings from "./components/settings";
import useJira from "./components/hooks/useJira";
import useGithub from "./components/hooks/useGithub";
import useGitlab from "./components/hooks/useGitlab";
import useServiceItems from "./components/hooks/useServiceItems";
import useCalendar from "./components/hooks/useCalendar";
import useStorage from "./components/hooks/useStorage";
import { fetchTrelloItems } from "./components/api/trello";
import { fetchNotionItems } from "./components/api/notion";
import { fetchLinearItems } from "./components/api/linear";
import {
  FeedItem,
  FeedSource,
  jiraToFeed,
  gitToFeed,
  taskToFeed,
  calendarToFeed,
  sortFeed,
} from "./components/api/feed";
import {
  getUserName,
  hasTrelloCredentials,
  hasNotionCredentials,
  hasLinearCredentials,
  getLayoutMode,
  saveLayoutMode,
  LayoutMode,
} from "./components/api/storage";

interface ServiceEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  node: React.ReactNode;
}

// Brand icons for the GitHub / GitLab panels
const GithubIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const GitlabIcon = (
  <svg viewBox="0 0 24 24" fill="#FC6D26">
    <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.919 1.263a.455.455 0 0 0-.867 0L1.388 9.452.046 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.623-8.443a.924.924 0 0 0 .332-1.024"/>
  </svg>
);

const TrelloIcon = (
  <svg viewBox="0 0 24 24" fill="#0079BF">
    <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v12.36zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V5.82c0-.795.646-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v6.36z"/>
  </svg>
);

const NotionIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.216-1.632z"/>
  </svg>
);

const LinearIcon = (
  <svg viewBox="0 0 24 24" fill="#5E6AD2">
    <path d="M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.01c0 3.6-1.584 6.83-4.094 9.03L2.886 4.18zM1.06 6.62L17.38 22.94a11.953 11.953 0 0 1-3.04 .912L.148 9.66c.198-1.07.51-2.094.912-3.04zM.002 12.762l11.236 11.236c-.71-.046-1.404-.15-2.077-.31L.312 14.84a11.96 11.96 0 0 1-.31-2.078zM.74 17.5l5.76 5.76a12.04 12.04 0 0 1-5.76-5.76z"/>
  </svg>
);

const JiraIcon = (
  <svg viewBox="0 0 24 24" fill="#2684FF">
    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z"/>
  </svg>
);

const CalendarIcon = (
  <svg viewBox="0 0 24 24" fill="#4285F4">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
  </svg>
);

const NewTab: React.FC = () => {
  const { photo, refreshPhotos } = useStorage();
  const { tickets, loading, error, isConfigured, refetch } = useJira();
  const {
    items: githubItems,
    loading: githubLoading,
    error: githubError,
    isConfigured: githubConfigured,
    refetch: refetchGithub,
  } = useGithub();
  const {
    items: gitlabItems,
    loading: gitlabLoading,
    error: gitlabError,
    isConfigured: gitlabConfigured,
    refetch: refetchGitlab,
  } = useGitlab();
  const {
    items: trelloItems,
    loading: trelloLoading,
    error: trelloError,
    isConfigured: trelloConfigured,
    refetch: refetchTrello,
  } = useServiceItems(fetchTrelloItems, hasTrelloCredentials, "Trello");
  const {
    items: notionItems,
    loading: notionLoading,
    error: notionError,
    isConfigured: notionConfigured,
    refetch: refetchNotion,
  } = useServiceItems(fetchNotionItems, hasNotionCredentials, "Notion");
  const {
    items: linearItems,
    loading: linearLoading,
    error: linearError,
    isConfigured: linearConfigured,
    refetch: refetchLinear,
  } = useServiceItems(fetchLinearItems, hasLinearCredentials, "Linear");
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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("myday");

  // Load user name + layout preference from storage
  useEffect(() => {
    getUserName().then(setUserName);
    getLayoutMode().then(setLayoutMode);
  }, []);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    saveLayoutMode(mode);
  };

  const handleSettingsSave = () => {
    setShowSettings(false);
    refetch();
    refetchGithub();
    refetchGitlab();
    refetchTrello();
    refetchNotion();
    refetchLinear();
    // Reload user name in case it was changed
    getUserName().then(setUserName);
  };

  // Brand icon per feed source (used by My Day + Tabs)
  const ICONS: Record<FeedSource, React.ReactNode> = {
    jira: JiraIcon,
    github: GithubIcon,
    gitlab: GitlabIcon,
    trello: TrelloIcon,
    notion: NotionIcon,
    linear: LinearIcon,
    calendar: CalendarIcon,
  };

  // The panels for each connected service (used by Boards + Tabs)
  const services: ServiceEntry[] = [
    isConfigured && {
      key: "jira",
      label: "Jira",
      icon: JiraIcon,
      node: (
        <JiraTickets tickets={tickets} loading={loading} error={error || undefined} />
      ),
    },
    githubConfigured && {
      key: "github",
      label: "GitHub",
      icon: GithubIcon,
      node: (
        <GitItems
          title="GitHub"
          icon={GithubIcon}
          accent="github"
          items={githubItems}
          loading={githubLoading}
          error={githubError || undefined}
        />
      ),
    },
    gitlabConfigured && {
      key: "gitlab",
      label: "GitLab",
      icon: GitlabIcon,
      node: (
        <GitItems
          title="GitLab"
          icon={GitlabIcon}
          accent="gitlab"
          items={gitlabItems}
          loading={gitlabLoading}
          error={gitlabError || undefined}
        />
      ),
    },
    trelloConfigured && {
      key: "trello",
      label: "Trello",
      icon: TrelloIcon,
      node: (
        <TaskItems
          title="Trello"
          icon={TrelloIcon}
          accent="trello"
          items={trelloItems}
          loading={trelloLoading}
          error={trelloError || undefined}
          emptyLabel="No cards assigned"
        />
      ),
    },
    notionConfigured && {
      key: "notion",
      label: "Notion",
      icon: NotionIcon,
      node: (
        <TaskItems
          title="Notion"
          icon={NotionIcon}
          accent="notion"
          items={notionItems}
          loading={notionLoading}
          error={notionError || undefined}
          emptyLabel="No pages found"
        />
      ),
    },
    linearConfigured && {
      key: "linear",
      label: "Linear",
      icon: LinearIcon,
      node: (
        <TaskItems
          title="Linear"
          icon={LinearIcon}
          accent="linear"
          items={linearItems}
          loading={linearLoading}
          error={linearError || undefined}
          emptyLabel="No issues assigned"
        />
      ),
    },
    calendarConnected && {
      key: "calendar",
      label: "Calendar",
      icon: CalendarIcon,
      node: (
        <CalendarEvents
          events={calendarEvents}
          loading={calendarLoading}
          error={calendarError || undefined}
          isAuthenticated={calendarConnected}
          onConnect={connectCalendar}
        />
      ),
    },
  ].filter(Boolean) as ServiceEntry[];

  // Aggregated feed for My Day, sorted by priority (most urgent first).
  const feedItems: FeedItem[] = sortFeed([
    ...(calendarConnected ? calendarToFeed(calendarEvents) : []),
    ...(isConfigured ? jiraToFeed(tickets) : []),
    ...(githubConfigured ? gitToFeed(githubItems, "github") : []),
    ...(gitlabConfigured ? gitToFeed(gitlabItems, "gitlab") : []),
    ...(trelloConfigured ? taskToFeed(trelloItems, "trello") : []),
    ...(linearConfigured ? taskToFeed(linearItems, "linear") : []),
    ...(notionConfigured ? taskToFeed(notionItems, "notion") : []),
  ]);

  const anyConfigured = services.length > 0;
  const anyLoading =
    loading ||
    githubLoading ||
    gitlabLoading ||
    trelloLoading ||
    notionLoading ||
    linearLoading ||
    calendarLoading;

  const renderDashboard = () => {
    if (layoutMode === "myday") {
      return <MyDay items={feedItems} icons={ICONS} loading={anyLoading} />;
    }
    if (layoutMode === "tabs") {
      const panels: TabPanel[] = services.map((s) => ({
        key: s.key,
        label: s.label,
        icon: s.icon,
        node: s.node,
      }));
      return <LayoutTabs panels={panels} />;
    }
    // boards
    return (
      <div className="content-panels">
        {services.map((s) => (
          <div className="tickets-container" key={s.key}>
            {s.node}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="App">
      <Layout.Background photo={photo} />
      
      {/* Top right corner - Settings button (always visible) */}
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
                layoutMode={layoutMode}
                onLayoutChange={handleLayoutChange}
                isJiraConfigured={isConfigured}
                isGithubConfigured={githubConfigured}
                isGitlabConfigured={gitlabConfigured}
                isTrelloConfigured={trelloConfigured}
                isNotionConfigured={notionConfigured}
                isLinearConfigured={linearConfigured}
                calendarConnected={calendarConnected}
                calendarError={calendarError || undefined}
                onCalendarConnect={connectCalendar}
                onCalendarDisconnect={disconnectCalendar}
              />
            </div>
          </div>
        )}

        {/* Main Content — layout depends on user's preference. Setup is in the Settings modal. */}
        {!showSettings && anyConfigured && renderDashboard()}
      </div>
    </div>
  );
};

export default NewTab;
