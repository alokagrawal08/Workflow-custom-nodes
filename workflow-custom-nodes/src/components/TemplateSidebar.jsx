import { useRef } from 'react';
import { getNodeColor } from '../lib/constants';

/**
 * Left sidebar showing the template library.
 *
 * Clicking a template card creates a new node from that template.
 * All templates are user-created — there are no hardcoded built-ins.
 *
 * Node type badges get dynamic colours via getNodeColor(),
 * which supports any arbitrary string as a type.
 */
export default function TemplateSidebar({
  templates,
  onAddFromTemplate,
  onDeleteTemplate,
  onToggleReadonly,
  onShowJsonModal,
  onExport,
  onImport,
}) {
  const templateList = Object.values(templates);
  const fileInputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        onImport(JSON.parse(ev.target.result));
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function renderCard(t) {
    const colors = getNodeColor(t.nodeType);

    return (
      <div
        key={t.id}
        className="template-card"
        style={{ borderLeftColor: colors.bg }}
        onClick={() => onAddFromTemplate(t.id)}
      >
        {/* Top row: label + type badge */}
        <div className="tc-top-row">
          <div className="tc-label">{t.label}</div>
          <span
            className="tc-type-badge"
            style={{ background: colors.light, color: colors.bg }}
          >
            {t.nodeType || 'custom'}
          </span>
        </div>

        {/* Meta row: version + history count + readonly badge */}
        <div className="tc-meta-row">
          <span className="tc-version">v{t.version}</span>
          {t.history?.length > 0 && (
            <span className="tc-history-badge" title={`${t.history.length} previous version(s)`}>
              {t.history.length} prev
            </span>
          )}
          {t.readonly && (
            <span className="tc-readonly-badge">🔒 Locked</span>
          )}
        </div>

        {/* Property keys preview */}
        {t.properties?.length > 0 && (
          <div className="tc-props">
            {t.properties.map((p) => p.key).join(' · ')}
          </div>
        )}

        {/* Action buttons */}
        <div
          className="template-card-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={t.readonly ? 'unlock-btn' : 'lock-btn'}
            onClick={() => onToggleReadonly(t.id)}
            title={
              t.readonly
                ? 'Unlock template — instances become editable'
                : 'Lock template — instances become read-only'
            }
          >
            {t.readonly ? '🔓 Unlock' : '🔒 Lock'}
          </button>
          <button className="danger" onClick={() => onDeleteTemplate(t.id)}>
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="template-sidebar">
      <h2>📋 Template Library</h2>

      <button className="add-node-btn" onClick={onShowJsonModal}>
        + Create from JSON
      </button>

      <div className="template-section">
        <h3>Saved Templates</h3>
        {templateList.length > 0 ? (
          templateList.map(renderCard)
        ) : (
          <p className="empty-hint">
            No templates yet. Create a node from JSON, then click it → "Save as
            Template".
          </p>
        )}
      </div>

      <div className="import-export-bar">
        <button onClick={onExport}>⬇ Export All</button>
        <button onClick={() => fileInputRef.current?.click()}>
          ⬆ Import JSON
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
