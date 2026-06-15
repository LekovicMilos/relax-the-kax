import React, { useState, useEffect } from "react";
import {
  getTrelloCredentials,
  saveTrelloCredentials,
  clearTrelloCredentials,
  getTrelloFilter,
  saveTrelloFilter,
} from "../api/storage";
import {
  fetchTrelloBoards,
  fetchTrelloLists,
  TrelloBoard,
  TrelloList,
} from "../api/trello";
import "../jira-settings/JiraSettings.css";

const TOKEN_PLACEHOLDER = "••••••••••••••••";

const TrelloSettings: React.FC<{ isConfigured: boolean; onSave?: () => void }> = ({
  isConfigured,
  onSave,
}) => {
  const [key, setKey] = useState("");
  const [token, setToken] = useState("");
  const [boardId, setBoardId] = useState("");
  const [listIds, setListIds] = useState<string[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [lists, setLists] = useState<TrelloList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stored credentials + filter on mount
  useEffect(() => {
    (async () => {
      const creds = await getTrelloCredentials();
      if (creds.trello_key) setKey(TOKEN_PLACEHOLDER);
      if (creds.trello_token) setToken(TOKEN_PLACEHOLDER);

      const filter = await getTrelloFilter();
      setBoardId(filter.boardId);
      setListIds(filter.listIds);
      setOnlyMine(filter.onlyMine);

      if (creds.trello_key && creds.trello_token) {
        const fetched = await fetchTrelloBoards();
        setBoards(fetched);
        if (filter.boardId) loadLists(filter.boardId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLists = async (id: string) => {
    if (!id) {
      setLists([]);
      return;
    }
    setLoadingLists(true);
    const fetched = await fetchTrelloLists(id);
    setLists(fetched);
    setLoadingLists(false);
  };

  const handleBoardChange = (id: string) => {
    setBoardId(id);
    setListIds([]); // reset column selection when board changes
    loadLists(id);
  };

  const toggleList = (id: string) => {
    setListIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setError(null);

    // Resolve credentials (reuse stored values when inputs show the placeholder)
    const stored = await getTrelloCredentials();
    const finalKey = !key || key === TOKEN_PLACEHOLDER ? stored.trello_key : key;
    const finalToken =
      !token || token === TOKEN_PLACEHOLDER ? stored.trello_token : token;

    if (!finalKey || !finalToken) {
      setError("Please enter your Trello API key and token");
      return;
    }

    const result = await saveTrelloCredentials(finalKey, finalToken);
    if (!result.success) {
      setError(result.error || "Failed to save");
      return;
    }

    await saveTrelloFilter(boardId, listIds, onlyMine);

    // First-time save: populate the board picker now that creds exist
    if (boards.length === 0) {
      setBoards(await fetchTrelloBoards());
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSave?.();
    }, 1500);
  };

  const handleDisconnect = async () => {
    if (confirm("Disconnect Trello? Your credentials will be removed.")) {
      await clearTrelloCredentials();
      setKey("");
      setToken("");
      setBoardId("");
      setListIds([]);
      setOnlyMine(false);
      setBoards([]);
      setLists([]);
      onSave?.();
    }
  };

  return (
    <div className="jira-settings jira-settings-embedded">
      <p className="jira-settings-description">
        Get your API key, then generate a token from the same page.
        <br />
        <a
          href="https://trello.com/power-ups/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="jira-help-link"
        >
          Get your Trello key &amp; token here →
        </a>
      </p>

      <div className="jira-form">
        <div className="jira-input-group">
          <label htmlFor="trello-key">API Key</label>
          <input
            id="trello-key"
            type="password"
            placeholder="Your Trello API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onFocus={() => {
              if (key === TOKEN_PLACEHOLDER) setKey("");
            }}
            className="jira-input"
          />
        </div>

        <div className="jira-input-group">
          <label htmlFor="trello-token">API Token</label>
          <input
            id="trello-token"
            type="password"
            placeholder="Your Trello token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onFocus={() => {
              if (token === TOKEN_PLACEHOLDER) setToken("");
            }}
            className="jira-input"
          />
        </div>

        {/* Board + column selection (available once credentials are saved) */}
        {isConfigured && boards.length > 0 && (
          <>
            <div className="jira-input-group">
              <label htmlFor="trello-board">Board</label>
              <select
                id="trello-board"
                className="jira-input"
                value={boardId}
                onChange={(e) => handleBoardChange(e.target.value)}
              >
                <option value="">All cards assigned to me</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {boardId && (
              <div className="jira-input-group">
                <label className="jira-checkbox-label">
                  <input
                    type="checkbox"
                    checked={onlyMine}
                    onChange={() => setOnlyMine((v) => !v)}
                    className="jira-checkbox"
                  />
                  <span className="jira-checkbox-text">Only my cards</span>
                </label>
              </div>
            )}

            {boardId && (
              <div className="jira-input-group">
                <label>Columns to show {listIds.length === 0 && "(all)"}</label>
                {loadingLists ? (
                  <span className="jira-settings-description">Loading columns…</span>
                ) : (
                  <div className="jira-status-checkboxes">
                    {lists.map((l) => (
                      <label key={l.id} className="jira-checkbox-label">
                        <input
                          type="checkbox"
                          checked={listIds.includes(l.id)}
                          onChange={() => toggleList(l.id)}
                          className="jira-checkbox"
                        />
                        <span className="jira-checkbox-text">{l.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {isConfigured && boards.length === 0 && (
          <p className="jira-settings-description">
            Save your credentials to pick a board and columns.
          </p>
        )}

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

export default TrelloSettings;
