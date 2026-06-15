import React from "react";
import ServiceTokenSettings from "./ServiceTokenSettings";
import {
  getLinearCredentials,
  saveLinearCredentials,
  clearLinearCredentials,
} from "../api/storage";

const LinearSettings: React.FC<{ isConfigured: boolean; onSave?: () => void }> = ({
  isConfigured,
  onSave,
}) => (
  <ServiceTokenSettings
    isConfigured={isConfigured}
    onSave={onSave}
    serviceName="Linear"
    fields={[
      { id: "linear_token", label: "API Key", placeholder: "lin_api_..." },
    ]}
    description={
      <>
        Create a personal API key in Linear settings.
        <br />
        <a
          href="https://linear.app/settings/account/security"
          target="_blank"
          rel="noopener noreferrer"
          className="jira-help-link"
        >
          Get your Linear API key here →
        </a>
      </>
    }
    load={async () => {
      const c = await getLinearCredentials();
      return { linear_token: c.linear_token };
    }}
    save={(v) => saveLinearCredentials(v.linear_token)}
    clear={clearLinearCredentials}
  />
);

export default LinearSettings;
