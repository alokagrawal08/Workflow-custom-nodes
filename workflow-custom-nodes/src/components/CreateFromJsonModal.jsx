import { useState } from 'react';
import { validateNodeConfig } from '../lib/validation';

const DEFAULT_JSON = JSON.stringify(
  {
    nodeType: 'api-call',
    label: 'Fetch User Data',
    properties: [
      { key: 'endpoint', value: '/api/users', type: 'string' },
      { key: 'timeout', value: '30', type: 'number' },
      { key: 'retryEnabled', value: 'true', type: 'boolean' },
      { key: 'method', value: 'GET', type: 'select', options: 'GET,POST,PUT,DELETE' },
    ],
  },
  null,
  2,
);

/**
 * Modal dialog that lets users paste raw JSON to create a new node.
 *
 * Validates the JSON structure using the shared `validateNodeConfig`
 * before handing it off to the parent.
 */
export default function CreateFromJsonModal({ onClose, onCreate }) {
  const [json, setJson] = useState(DEFAULT_JSON);
  const [error, setError] = useState('');

  function handleCreate() {
    try {
      const config = JSON.parse(json);
      const errs = validateNodeConfig(config);
      if (errs.length) {
        setError(errs.join(' '));
        return;
      }
      onCreate(config);
      onClose();
    } catch {
      setError('Invalid JSON — please check your syntax and try again.');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Create Node from JSON</h3>

        {error && (
          <div className="validation-errors">
            <p>{error}</p>
          </div>
        )}

        <div className="editor-field">
          <label>Node Configuration (JSON)</label>
          <textarea
            className="editor-input json-textarea"
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
