import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';

/**
 * Custom edge with a delete button shown at the midpoint.
 *
 * Clicking the × button removes the edge from the graph.
 * This solves the problem of edges being non-removable once created.
 */
export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  function onDelete(e) {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="edge-delete-btn"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <button onClick={onDelete} title="Remove connection">
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
