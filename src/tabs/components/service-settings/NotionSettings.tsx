import React from "react";
import ServiceTokenSettings from "./ServiceTokenSettings";
import {
  getNotionCredentials,
  saveNotionCredentials,
  clearNotionCredentials,
} from "../api/storage";

const NotionSettings: React.FC<{ isConfigured: boolean; onSave?: () => void }> = ({
  isConfigured,
  onSave,
}) => (
  <ServiceTokenSettings
    isConfigured={isConfigured}
    onSave={onSave}
    serviceName="Notion"
    fields={[
      { id: "notion_token", label: "Integration Token", placeholder: "secret_... / ntn_..." },
    ]}
    description={
      <>
        Create an internal integration, then share the pages/databases you want
        to see with it.
        <br />
        <a
          href="https://www.notion.so/my-integrations"
          target="_blank"
          rel="noopener noreferrer"
          className="jira-help-link"
        >
          Create your Notion integration here →
        </a>
      </>
    }
    load={async () => {
      const c = await getNotionCredentials();
      return { notion_token: c.notion_token };
    }}
    save={(v) => saveNotionCredentials(v.notion_token)}
    clear={clearNotionCredentials}
  />
);

export default NotionSettings;
