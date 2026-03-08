import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { getNodeColor } from './lib/constants';
import { uid } from './lib/uid';
import { Storage } from './lib/storage';

import ConfigNode from './components/ConfigNode';
import DeletableEdge from './components/DeletableEdge';
import EditorPanel from './components/EditorPanel';
import TemplateSidebar from './components/TemplateSidebar';
import CreateFromJsonModal from './components/CreateFromJsonModal';
import ToastContainer from './components/ToastContainer';

import './App.css';

/**
 * Root application component.
 *
 * State architecture:
 *   templates  – persisted map of reusable node definitions (localStorage)
 *   nodes/edges – ReactFlow graph state (also persisted to localStorage)
 *   selectedNodeId – ID of the node currently open in the editor panel
 *   showJsonModal – whether the "Create from JSON" modal is visible
 *   toasts – ephemeral notification messages
 *
 * All state is local to this component and passed down via props.
 * There is no global mutable state or context provider.
 */
export default function App() {
  // ─── Templates ─────────────────────────────────
  const [templates, setTemplates] = useState(() => Storage.getTemplates());

  // ─── Graph state ───────────────────────────────
  const savedGraph = useMemo(() => Storage.getGraphState(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    savedGraph?.nodes || [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    savedGraph?.edges || [],
  );

  // ─── UI state ──────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  /**
   * `nodeTypes` must be a stable reference to prevent ReactFlow
   * from re-mounting every node on each render.
   */
  const nodeTypes = useMemo(() => ({ configNode: ConfigNode }), []);
  const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);

  // ─── Persist on change ─────────────────────────
  useEffect(() => {
    Storage.saveGraphState(nodes, edges);
  }, [nodes, edges]);

  useEffect(() => {
    Storage.saveTemplates(templates);
  }, [templates]);

  // ─── Toast helper ──────────────────────────────
  function toast(message, type = 'success') {
    const id = uid('toast');
    setToasts((ts) => [...ts, { id, message, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2500);
  }

  // ─── Node factory ──────────────────────────────
  function createNodeFromConfig(config, position) {
    return {
      id: uid('n'),
      type: 'configNode',
      position: position || {
        x: 100 + Math.random() * 400,
        y: 80 + Math.random() * 300,
      },
      data: {
        config: {
          ...config,
          properties: (config.properties || []).map((p) => ({ ...p })),
        },
      },
    };
  }

  // ─── Template → node ───────────────────────────
  function addFromTemplate(templateId) {
    const tmpl = templates[templateId];
    if (!tmpl) return;
    const node = createNodeFromConfig({
      ...tmpl,
      templateId: tmpl.id,
      templateVersion: tmpl.version,
    });
    setNodes((ns) => [...ns, node]);
    toast(`Created "${tmpl.label}" from template`);
  }

  // ─── JSON → node ──────────────────────────────
  function addFromJson(config) {
    setNodes((ns) => [...ns, createNodeFromConfig(config)]);
    toast('Node created from JSON');
  }

  // ─── Update node config ────────────────────────
  function updateNodeConfig(nodeId, newConfig) {
    setNodes((ns) =>
      ns.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...newConfig } } }
          : n,
      ),
    );
    toast('Node updated');
  }

  // ─── Delete node ───────────────────────────────
  function deleteNode(nodeId) {
    setNodes((ns) => ns.filter((n) => n.id !== nodeId));
    setEdges((es) =>
      es.filter((e) => e.source !== nodeId && e.target !== nodeId),
    );
    setSelectedNodeId(null);
    toast('Node deleted', 'info');
  }

  // ─── Save as template (with full version history) ──
  function saveAsTemplate(node) {
    const config = node.data.config;
    const existingId = config.templateId;
    const now = new Date().toISOString();

    if (existingId && templates[existingId]) {
      // Snapshot the current version before bumping
      const old = templates[existingId];
      const snapshot = {
        version: old.version,
        label: old.label,
        nodeType: old.nodeType,
        properties: (old.properties || []).map((p) => ({ ...p })),
        savedAt: old.updatedAt || old.createdAt,
      };
      const history = [...(old.history || []), snapshot];

      const newVersion = old.version + 1;
      const updated = {
        ...old,
        label: config.label,
        nodeType: config.nodeType,
        properties: (config.properties || []).map((p) => ({ ...p })),
        version: newVersion,
        updatedAt: now,
        history,
      };
      setTemplates((ts) => ({ ...ts, [existingId]: updated }));

      // Sync new version back into the node
      updateNodeConfig(node.id, {
        ...config,
        version: newVersion,
        templateVersion: newVersion,
      });

      toast(`Template "${updated.label}" updated to v${newVersion}`);
    } else {
      // Create new template (v1 — no history yet)
      const id = uid('tmpl');
      const tmpl = {
        id,
        nodeType: config.nodeType,
        label: config.label,
        properties: (config.properties || []).map(
          ({ key, value, type, options }) => ({ key, value, type, options }),
        ),
        version: 1,
        createdAt: now,
        updatedAt: now,
        readonly: false,
        history: [],
      };
      setTemplates((ts) => ({ ...ts, [id]: tmpl }));
      updateNodeConfig(node.id, {
        ...config,
        templateId: id,
        templateVersion: 1,
        version: 1,
      });
      toast(`Template "${tmpl.label}" saved`);
    }
  }

  // ─── Restore a previous version from history ──
  function restoreVersion(templateId, versionIndex) {
    const tmpl = templates[templateId];
    if (!tmpl || !tmpl.history?.[versionIndex]) return;

    const snapshot = tmpl.history[versionIndex];
    const now = new Date().toISOString();

    // Snapshot the CURRENT version before restoring
    const currentSnapshot = {
      version: tmpl.version,
      label: tmpl.label,
      nodeType: tmpl.nodeType,
      properties: (tmpl.properties || []).map((p) => ({ ...p })),
      savedAt: tmpl.updatedAt || tmpl.createdAt,
    };
    const history = [...tmpl.history, currentSnapshot];

    const newVersion = tmpl.version + 1;
    const restored = {
      ...tmpl,
      label: snapshot.label,
      nodeType: snapshot.nodeType,
      properties: (snapshot.properties || []).map((p) => ({ ...p })),
      version: newVersion,
      updatedAt: now,
      history,
    };
    setTemplates((ts) => ({ ...ts, [templateId]: restored }));

    // Update all canvas nodes linked to this template
    setNodes((ns) =>
      ns.map((n) =>
        n.data?.config?.templateId === templateId
          ? {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...n.data.config,
                  label: snapshot.label,
                  nodeType: snapshot.nodeType,
                  properties: (snapshot.properties || []).map((p) => ({ ...p })),
                  version: newVersion,
                  templateVersion: newVersion,
                },
              },
            }
          : n,
      ),
    );

    toast(`Restored v${snapshot.version} → now v${newVersion}`, 'info');
  }

  // ─── Delete template ───────────────────────────
  function deleteTemplate(id) {
    setTemplates((ts) => {
      const copy = { ...ts };
      delete copy[id];
      return copy;
    });
    toast('Template deleted', 'info');
  }

  // ─── Toggle read-only ─────────────────────────
  function toggleReadonly(id) {
    const newReadonly = !templates[id].readonly;

    // 1) Update the template itself
    setTemplates((ts) => ({
      ...ts,
      [id]: {
        ...ts[id],
        readonly: newReadonly,
        updatedAt: new Date().toISOString(),
      },
    }));

    // 2) Sync readonly flag to ALL existing nodes that came from this template
    setNodes((ns) =>
      ns.map((n) =>
        n.data?.config?.templateId === id
          ? {
              ...n,
              data: {
                ...n.data,
                config: { ...n.data.config, readonly: newReadonly },
              },
            }
          : n,
      ),
    );

    toast(
      newReadonly
        ? 'Template locked — all instances are now read-only'
        : 'Template unlocked — all instances are now editable',
      'info',
    );
  }

  // ─── Export all templates as JSON ──────────────
  function exportTemplates() {
    const blob = new Blob([JSON.stringify(templates, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-templates.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Templates exported');
  }

  // ─── Import templates from JSON ────────────────
  function importTemplates(data) {
    if (data.id && data.nodeType) {
      // Single template
      setTemplates((ts) => ({ ...ts, [data.id]: data }));
      toast('Template imported');
    } else {
      // Map of templates
      let count = 0;
      const merged = { ...templates };
      for (const [k, v] of Object.entries(data)) {
        if (v?.nodeType) {
          merged[k] = v;
          count++;
        }
      }
      setTemplates(merged);
      toast(`${count} template(s) imported`);
    }
  }

  // ─── ReactFlow callbacks ───────────────────────
  const onConnect = useCallback(
    (params) => {
      setEdges((es) =>
        addEdge(
          { ...params, type: 'deletable', animated: true, style: { stroke: '#94a3b8' } },
          es,
        ),
      );
    },
    [setEdges],
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // ─── Render ────────────────────────────────────
  return (
    <div className="app-layout">
      <TemplateSidebar
        templates={templates}
        onAddFromTemplate={addFromTemplate}
        onDeleteTemplate={deleteTemplate}
        onToggleReadonly={toggleReadonly}
        onShowJsonModal={() => setShowJsonModal(true)}
        onExport={exportTemplates}
        onImport={importTemplates}
      />

      <div className="canvas-area">
        {nodes.length === 0 && (
          <div className="canvas-empty-hint">
            <h3>No nodes yet</h3>
            <p>Create a node from a template in the sidebar,<br/>or use "Create from JSON" to get started.</p>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          defaultEdgeOptions={{
            type: 'deletable',
            animated: true,
            style: { stroke: '#94a3b8' },
          }}
        >
          <Controls />
          <MiniMap
            nodeColor={(n) =>
              getNodeColor(n.data?.config?.nodeType).bg
            }
            style={{ borderRadius: 8 }}
          />
          <Background variant="dots" gap={16} size={1} color="#e2e8f0" />
        </ReactFlow>
      </div>

      {selectedNode && (
        <EditorPanel
          node={selectedNode}
          templates={templates}
          onUpdate={updateNodeConfig}
          onClose={() => setSelectedNodeId(null)}
          onSaveAsTemplate={saveAsTemplate}
          onDelete={deleteNode}
          onRestoreVersion={restoreVersion}
        />
      )}

      {showJsonModal && (
        <CreateFromJsonModal
          onClose={() => setShowJsonModal(false)}
          onCreate={addFromJson}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
