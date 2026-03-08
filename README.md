# Workflow Custom Nodes with Reusable Templates

A ReactFlow-based system for creating, editing, and reusing data-driven workflow nodes from JSON configuration. Nodes are treated as data — not hardcoded components — making the system fully dynamic and extensible.

**Live Demo:** [https://workflow-custom-nodes.vercel.app/]

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/alokagrawal08/workflow-custom-nodes.git
cd workflow-custom-nodes

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

The app will be available at `http://localhost:5173`.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| @xyflow/react 12 | Graph rendering (ReactFlow) |
| Vite 6 | Build tool & dev server |
| Vitest | Unit testing |
| localStorage | Client-side persistence |

---

## Features

### 1. Custom Node Creation from JSON

Nodes are created by pasting a JSON configuration into the "Create from JSON" modal. The JSON defines the node type, label, and configurable properties — the UI renders entirely from this data.

**Example JSON:**
```json
{
  "nodeType": "api-call",
  "label": "Fetch User Data",
  "properties": [
    { "key": "endpoint", "value": "/api/users", "type": "string" },
    { "key": "timeout", "value": "30", "type": "number" },
    { "key": "retryEnabled", "value": "true", "type": "boolean" },
    { "key": "method", "value": "GET", "type": "select", "options": "GET,POST,PUT,DELETE" }
  ]
}
```

Node types are free-form strings — not limited to a predefined set. Any string works as a `nodeType`, and each type gets a unique deterministic color generated via string hashing.

### 2. Node Editing

Clicking any node on the canvas opens a resizable editor panel on the right side. From here you can:

- Edit the node label and type
- Add, remove, or modify properties (key, value, type)
- Supported property types: `string`, `number`, `boolean`, `select`
- Validation runs on every "Apply Changes" (required label, required type, unique keys, number validation, select options check)

### 3. Template Saving & Versioning

Any node can be saved as a reusable template. Templates store the node type, label, and default properties — but not position (since they are blueprints, not instances).

**Full version history** is maintained:
- Every save creates a new version (v1 → v2 → v3...)
- Previous versions are stored as snapshots with timestamps
- A collapsible version timeline in the editor shows the complete history
- Any previous version can be **restored** — this creates a new version (so nothing is ever lost)
- The sidebar shows the current version and number of previous versions for each template

### 4. Template Reuse & Persistence

Templates persist across sessions via `localStorage`. Click any template card in the sidebar to instantly create a new node from it. Templates survive page reloads and browser restarts.

Two localStorage keys are used:
- `wf_templates` — map of all template definitions
- `wf_graph_state` — current nodes and edges on the canvas

### 5. Read-Only vs Editable Templates (Lock/Unlock)

Templates can be locked or unlocked from the sidebar:

- **Locked templates** produce read-only node instances — all form inputs are disabled, the "Apply" and "Save" buttons are hidden
- Locking a template **immediately updates all existing nodes** on the canvas that came from it
- Locked nodes are visually distinct: dashed yellow border, dimmed body, lock icon in header, "LOCKED" badge, and a "Read-Only — Cannot Edit" footer stripe
- Unlocking reverses all of this instantly

### 6. Import / Export

- **Export All:** Downloads all templates as a single JSON file
- **Import JSON:** Upload a JSON file to merge templates into the library
- Supports both single-template and multi-template JSON formats

### 7. Validation

Node configuration is validated before applying changes:
- Label is required
- Node type is required
- Property keys must be non-empty
- Property keys must be unique (no duplicates)
- Number-type properties must contain valid numeric values
- Select-type properties must have at least one option defined

### 8. Edge Management

- Connect nodes by dragging from one handle to another
- Edges show a delete button (×) on hover at the midpoint
- Edges can also be deleted by selecting and pressing Backspace/Delete

---

## Architecture

### Project Structure

```
workflow-custom-nodes/
├── src/
│   ├── App.jsx                  # Root component — all state lives here
│   ├── App.css                  # Complete stylesheet
│   ├── main.jsx                 # React entry point
│   ├── components/
│   │   ├── ConfigNode.jsx       # Config-driven custom ReactFlow node
│   │   ├── EditorPanel.jsx      # Right-side editor with version history
│   │   ├── TemplateSidebar.jsx  # Left sidebar — template library
│   │   ├── CreateFromJsonModal.jsx  # JSON input modal
│   │   ├── DeletableEdge.jsx    # Custom edge with delete button
│   │   └── ToastContainer.jsx   # Notification toasts
│   └── lib/
│       ├── constants.js         # Color generation, property types, storage keys
│       ├── storage.js           # localStorage persistence layer
│       ├── uid.js               # Monotonic unique ID generator
│       └── validation.js        # Node config validation rules
├── tests/
│   ├── constants.test.js        # getNodeColor, hash-based colors
│   ├── storage.test.js          # Persistence read/write
│   ├── uid.test.js              # ID uniqueness and format
│   ├── validation.test.js       # All 7 validation rules
│   └── serialization.test.js    # JSON round-trip integrity
├── package.json
├── vite.config.js
└── index.html
```

### Design Decisions

**Templates vs Instances**

Templates and node instances are intentionally separate concepts:

| | Template | Node Instance |
|---|---|---|
| Position | No | Yes (x, y on canvas) |
| Template ID | Is the ID | References a template ID |
| Version | Tracks current version | Tracks which version it was created from |
| Read-only flag | Controls lock state | Inherited from template |
| Storage | `wf_templates` in localStorage | `wf_graph_state` in localStorage |

**State Management**

All state is local to `App.jsx` via React `useState` hooks. There is no global mutable state, no context providers, and no external state library. Data flows down via props, actions flow up via callbacks.

Three separate state domains:
1. **Graph state** (nodes + edges) — managed by ReactFlow's `useNodesState` / `useEdgesState`
2. **Template store** — a plain object map `{ [id]: template }`
3. **UI state** — selected node ID, modal visibility, toasts

**Stable Node Identity**

- Node IDs are generated via a monotonic counter (`Date.now()` base + increment), guaranteeing uniqueness
- `nodeTypes` and `edgeTypes` are wrapped in `useMemo` to prevent ReactFlow from re-mounting nodes on every render
- Node updates modify `data.config` without changing the node ID

**Dynamic Node Coloring**

Node types are not limited to a predefined set. `getNodeColor()` uses:
1. A lookup table for common types (process, decision, api, database, etc.)
2. A deterministic hash function for any other string — so "my-custom-type" always gets the same color

### Persistence Format

**Templates** (`wf_templates`):
```json
{
  "tmpl_abc123": {
    "id": "tmpl_abc123",
    "nodeType": "api-call",
    "label": "Fetch User Data",
    "properties": [
      { "key": "endpoint", "value": "/api/users", "type": "string" }
    ],
    "version": 3,
    "createdAt": "2026-03-08T10:00:00.000Z",
    "updatedAt": "2026-03-08T12:30:00.000Z",
    "readonly": false,
    "history": [
      {
        "version": 1,
        "label": "Fetch Data",
        "nodeType": "api-call",
        "properties": [...],
        "savedAt": "2026-03-08T10:00:00.000Z"
      },
      {
        "version": 2,
        "label": "Fetch User Data",
        "nodeType": "api-call",
        "properties": [...],
        "savedAt": "2026-03-08T11:15:00.000Z"
      }
    ]
  }
}
```

**Graph state** (`wf_graph_state`):
```json
{
  "nodes": [
    {
      "id": "n_abc123",
      "type": "configNode",
      "position": { "x": 250, "y": 100 },
      "data": {
        "config": {
          "label": "Fetch User Data",
          "nodeType": "api-call",
          "properties": [...],
          "templateId": "tmpl_abc123",
          "version": 3,
          "readonly": false
        }
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__n_abc-n_def",
      "source": "n_abc",
      "target": "n_def",
      "type": "deletable",
      "animated": true
    }
  ]
}
```

---

## Testing

5 test suites covering core logic:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

| Suite | What it tests |
|-------|---------------|
| `validation.test.js` | All 7 validation rules — required fields, unique keys, number parsing, select options |
| `storage.test.js` | localStorage read/write, corruption handling, round-trip integrity |
| `uid.test.js` | ID uniqueness, format, monotonic ordering |
| `constants.test.js` | Known color lookup, hash-based color generation, determinism, fallback |
| `serialization.test.js` | Full JSON round-trip for templates and graph state |

---

## Deployment

This is a standard Vite project. To deploy:

**Vercel:**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Upload the `dist/` folder to Netlify
```

**GitHub Pages:**
```bash
# Add base to vite.config.js: base: '/workflow-custom-nodes/'
npm run build
# Deploy the dist/ folder
```

---

## Constraints Met

| Constraint | Implementation |
|---|---|
| Node definitions fully serializable | Plain JSON objects, no functions or class instances |
| No global mutable state | All state in component-local `useState` hooks |
| No hardcoded node types in JSX | Single `ConfigNode` renders any config; colors via hash |
| ReactFlow is the only graph library | `@xyflow/react` v12 exclusively |
| Stable node identity | Monotonic IDs, `useMemo` for nodeTypes/edgeTypes |
| Clean separation of concerns | Graph state / node config / template storage are independent |

---

## Bonus Features Implemented

All four optional bonus features from the assignment are implemented:

1. **Template Versioning** — Full version history with timeline UI and one-click restore to any previous version
2. **Read-Only vs Editable** — Lock/unlock templates; syncs instantly to all canvas nodes with clear visual distinction
3. **Import / Export** — Download all templates as JSON; upload to merge
4. **Validation** — 7 rules validated on every "Apply Changes" with clear error messages
