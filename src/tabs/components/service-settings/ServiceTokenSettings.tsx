import React, { useState, useEffect } from "react";
import "../jira-settings/JiraSettings.css";

export interface ServiceField {
  id: string;
  label: string;
  placeholder?: string;
}

interface ServiceTokenSettingsProps {
  isConfigured: boolean;
  onSave?: () => void;
  /** Help text / link shown above the form. */
  description: React.ReactNode;
  /** Secret fields rendered as password inputs. */
  fields: ServiceField[];
  /** Returns the currently stored values keyed by field id. */
  load: () => Promise<Record<string, string>>;
  /** Persists the values keyed by field id. */
  save: (values: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  /** Removes the stored credentials. */
  clear: () => Promise<boolean>;
  /** Human label used in the disconnect confirmation. */
  serviceName: string;
}

const PLACEHOLDER = "••••••••••••••••";

const ServiceTokenSettings: React.FC<ServiceTokenSettingsProps> = ({
  isConfigured,
  onSave,
  description,
  fields,
  load,
  save,
  clear,
  serviceName,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load().then((stored) => {
      const next: Record<string, string> = {};
      fields.forEach((f) => {
        next[f.id] = stored[f.id] ? PLACEHOLDER : "";
      });
      setValues(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (id: string, value: string) =>
    setValues((prev) => ({ ...prev, [id]: value }));

  const handleSave = async () => {
    setError(null);

    const stored = await load();
    const finalValues: Record<string, string> = {};
    for (const f of fields) {
      const current = values[f.id];
      finalValues[f.id] =
        !current || current === PLACEHOLDER ? stored[f.id] || "" : current;
      if (!finalValues[f.id]) {
        setError(`Please enter your ${f.label}`);
        return;
      }
    }

    const result = await save(finalValues);
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
    if (confirm(`Disconnect ${serviceName}? Your credentials will be removed.`)) {
      await clear();
      const cleared: Record<string, string> = {};
      fields.forEach((f) => (cleared[f.id] = ""));
      setValues(cleared);
      onSave?.();
    }
  };

  return (
    <div className="jira-settings jira-settings-embedded">
      <p className="jira-settings-description">{description}</p>

      <div className="jira-form">
        {fields.map((f) => (
          <div className="jira-input-group" key={f.id}>
            <label htmlFor={`svc-${f.id}`}>{f.label}</label>
            <input
              id={`svc-${f.id}`}
              type="password"
              placeholder={f.placeholder}
              value={values[f.id] || ""}
              onChange={(e) => setField(f.id, e.target.value)}
              onFocus={() => {
                if (values[f.id] === PLACEHOLDER) setField(f.id, "");
              }}
              className="jira-input"
            />
          </div>
        ))}

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

export default ServiceTokenSettings;
