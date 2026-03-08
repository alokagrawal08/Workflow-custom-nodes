import { useState, useEffect, useRef, useCallback } from 'react';
import { PROP_TYPES } from '../lib/constants';
import { validateNodeConfig } from '../lib/validation';

const MIN_WIDTH = 320;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 380;

export default function EditorPanel({
  node,
  templates,
  onUpdate,
  onClose,
  onSaveAsTemplate,
  onDelete,
  onRestoreVersion,
}) {
  const config = node.data.config || {};
  const isReadonly = config.readonly === true;

  const [label, setLabel] = useState(config.label || '');
  const [nodeType, setNodeType] = useState(config.nodeType || '');
  const [properties, setProperties] = useState(() =>
    (config.properties || []).map((p) => ({ ...p })),
  );
  const [errors, setErrors] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback((e) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [width]);

  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    }
    function onMouseUp() {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const c = node.data.config || {};
    setLabel(c.label || '');
    setNodeType(c.nodeType || '');
    setProperties((c.properties || []).map((p) => ({ ...p })));
    setErrors([]);
    setShowHistory(false);
  }, [node.id]);

  // Get history from template store (live, not stale from node config)
  const template = config.templateId ? templates[config.templateId] : null;
  const history = template?.history || [];

  function apply() {
    const draft = { ...config, label, nodeType, properties };
    const errs = validateNodeConfig(draft);
    setErrors(errs);
    if (errs.length) return;
    onUpdate(node.id, draft);
  }

  function addProp() {
    setProperties((ps) => [
      ...ps,
      { key: '', value: '', type: 'string', options: '' },
    ]);
  }

  function updateProp(idx, field, val) {
    setProperties((ps) =>
      ps.map((p, i) => (i === idx ? { ...p, [field]: val } : p)),
    );
  }

  function removeProp(idx) {
    setProperties((ps) => ps.filter((_, i) => i !== idx));
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function renderPropValueInput(p, i) {
    if (p.type === 'boolean') {
      return (
        <select
          className="ep-input"
          value={String(p.value)}
          disabled={isReadonly}
          onChange={(e) => updateProp(i, 'value', e.target.value)}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    if (p.type === 'select') {
      return (
        <>
          <select
            className="ep-input"
            value={p.value}
            disabled={isReadonly}
            onChange={(e) => updateProp(i, 'value', e.target.value)}
          >
            <option value="">— select —</option>
            {(p.options || '')
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
              .map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
          </select>
          <input
            className="ep-input"
            placeholder="Options (comma-sep)"
            value={p.options || ''}
            disabled={isReadonly}
            onChange={(e) => updateProp(i, 'options', e.target.value)}
          />
        </>
      );
    }
    return (
      <input
        className="ep-input"
        placeholder="Value"
        value={p.value}
        disabled={isReadonly}
        type={p.type === 'number' ? 'number' : 'text'}
        onChange={(e) => updateProp(i, 'value', e.target.value)}
      />
    );
  }

  return (
    <div className="ep" style={{ width, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}>
      <div className="editor-resize-handle" onMouseDown={onMouseDown} />

      {/* ── Header ── */}
      <div className="ep-header">
        <h3 className="ep-title">{isReadonly ? '🔒 View Node' : 'Edit Node'}</h3>
        {isReadonly && <span className="ep-tag warn">Locked</span>}
        {config.templateId && config.version > 1 && (
          <span className="ep-tag version">v{config.version}</span>
        )}
        <div style={{ flex: 1 }} />
        <button
          className="ep-icon-btn danger"
          title="Delete node"
          onClick={() => onDelete(node.id)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
        <button className="ep-icon-btn" onClick={onClose} title="Close">×</button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="ep-body">
        {isReadonly && (
          <div className="ep-locked-banner">
            <span className="ep-locked-icon">🔒</span>
            <div>
              <strong>This node is locked</strong>
              <p>The template is read-only. Unlock it from the sidebar to enable editing.</p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="validation-errors">
            {errors.map((e, i) => <p key={i}>• {e}</p>)}
          </div>
        )}

        {/* Label */}
        <div className="ep-field">
          <label className="ep-label">Label</label>
          <input
            className="ep-input"
            value={label}
            disabled={isReadonly}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Node Type */}
        <div className="ep-field">
          <label className="ep-label">Node Type</label>
          <input
            className="ep-input"
            value={nodeType}
            disabled={isReadonly}
            placeholder="e.g. api, process, database..."
            onChange={(e) => setNodeType(e.target.value)}
          />
        </div>

        {/* Meta */}
        <div className="ep-meta">
          <span className="ep-meta-k">ID</span>
          <span className="ep-meta-v">{node.id}</span>
          {config.templateId && (
            <>
              <span className="ep-meta-dot">·</span>
              <span className="ep-meta-k">Template</span>
              <span className="ep-meta-v">{config.templateId}</span>
            </>
          )}
        </div>

        {/* ── Version History Section ── */}
        {config.templateId && history.length > 0 && (
          <div className="vh-section">
            <button
              className="vh-toggle"
              onClick={() => setShowHistory((v) => !v)}
            >
              <span className="vh-toggle-icon">{showHistory ? '▾' : '▸'}</span>
              <span>Version History ({history.length} previous)</span>
              <span className="vh-current-tag">Current: v{config.version || template?.version}</span>
            </button>

            {showHistory && (
              <div className="vh-timeline">
                {/* Current version (top) */}
                <div className="vh-item current">
                  <div className="vh-dot current" />
                  <div className="vh-content">
                    <div className="vh-version">v{template?.version} — Current</div>
                    <div className="vh-label">{template?.label}</div>
                    <div className="vh-date">{formatDate(template?.updatedAt)}</div>
                    <div className="vh-props">
                      {(template?.properties || []).map((p) => p.key).join(', ') || 'No properties'}
                    </div>
                  </div>
                </div>

                {/* Past versions (newest first) */}
                {[...history].reverse().map((snap, idx) => {
                  const realIndex = history.length - 1 - idx;
                  return (
                    <div key={realIndex} className="vh-item">
                      <div className="vh-dot" />
                      <div className="vh-content">
                        <div className="vh-version-row">
                          <span className="vh-version">v{snap.version}</span>
                          <button
                            className="vh-restore-btn"
                            onClick={() => onRestoreVersion(config.templateId, realIndex)}
                            title={`Restore v${snap.version} as a new version`}
                          >
                            Restore
                          </button>
                        </div>
                        <div className="vh-label">{snap.label}</div>
                        <div className="vh-date">{formatDate(snap.savedAt)}</div>
                        <div className="vh-props">
                          {(snap.properties || []).map((p) => p.key).join(', ') || 'No properties'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Properties */}
        <div className="ep-section-header">
          <span className="ep-section-title">Properties ({properties.length})</span>
          {!isReadonly && (
            <button className="ep-add-btn" onClick={addProp}>+ Add</button>
          )}
        </div>

        {properties.map((p, i) => (
          <div key={i} className="ep-prop">
            <div className="ep-prop-row">
              <input
                className="ep-input"
                placeholder="Key"
                value={p.key}
                disabled={isReadonly}
                onChange={(e) => updateProp(i, 'key', e.target.value)}
              />
              <select
                className="ep-input ep-type-sel"
                value={p.type || 'string'}
                disabled={isReadonly}
                onChange={(e) => updateProp(i, 'type', e.target.value)}
              >
                {PROP_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {!isReadonly && (
                <button className="ep-rm-btn" onClick={() => removeProp(i)}>×</button>
              )}
            </div>
            <div className="ep-prop-row">
              {renderPropValueInput(p, i)}
            </div>
          </div>
        ))}

        {properties.length === 0 && (
          <p className="ep-empty">No properties yet. Click "+ Add" above.</p>
        )}
      </div>

      {/* ── Footer ── */}
      {!isReadonly && (
        <div className="ep-footer">
          <button className="ep-btn primary" onClick={apply}>
            Apply Changes
          </button>
          <button
            className="ep-btn secondary"
            onClick={() => onSaveAsTemplate(node)}
          >
            {config.templateId ? `Save as v${(config.version || 1) + 1}` : 'Save as Template'}
          </button>
        </div>
      )}
    </div>
  );
}
