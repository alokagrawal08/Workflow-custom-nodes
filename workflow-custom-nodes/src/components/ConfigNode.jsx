import { Handle, Position } from '@xyflow/react';
import { getNodeColor } from '../lib/constants';

/**
 * Config-driven custom node for ReactFlow.
 *
 * Rendering is entirely determined by `data.config`.
 * When config.readonly is true, the node shows a prominent
 * lock indicator and a dimmed body to communicate that
 * editing is disabled.
 */
export default function ConfigNode({ data, selected }) {
  const config = data.config || {};
  const colors = getNodeColor(config.nodeType);
  const isLocked = config.readonly === true;

  return (
    <div
      className={
        'config-node' +
        (selected ? ' selected' : '') +
        (isLocked ? ' locked' : '')
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: colors.bg }}
      />

      {/* Header */}
      <div className="config-node-header" style={{ background: colors.bg }}>
        <div className="config-node-header-text">
          <span className="config-node-label">
            {isLocked && <span className="config-node-lock-icon">🔒 </span>}
            {config.label || 'Untitled'}
          </span>
          {config.nodeType && (
            <span className="config-node-type">
              {config.nodeType}
            </span>
          )}
        </div>
        <div className="config-node-badges">
          {isLocked && (
            <span className="config-node-badge locked-badge" title="Read-only node">
              LOCKED
            </span>
          )}
          {config.templateId && !isLocked && (
            <span className="config-node-badge" title="From template">
              T
            </span>
          )}
          {config.version > 1 && (
            <span
              className="config-node-version-badge"
              title={`Template version ${config.version}`}
            >
              v{config.version}
            </span>
          )}
        </div>
      </div>

      {/* Body — property list */}
      {config.properties?.length > 0 && (
        <div className="config-node-body">
          {config.properties.slice(0, 8).map((p, i) => (
            <div key={i} className="config-node-prop">
              <span className="key">{p.key}</span>
              <span className="val">
                {p.type === 'boolean'
                  ? p.value === 'true' || p.value === true
                    ? '✓ Yes'
                    : '✗ No'
                  : String(p.value || '—')}
              </span>
            </div>
          ))}
          {config.properties.length > 8 && (
            <div className="config-node-overflow">
              +{config.properties.length - 8} more
            </div>
          )}
        </div>
      )}

      {/* Read-only footer stripe */}
      {isLocked && (
        <div className="config-node-readonly">
          Read-Only — Cannot Edit
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: colors.bg }}
      />
    </div>
  );
}
