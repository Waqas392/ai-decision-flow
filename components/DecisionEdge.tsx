"use client";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

// Registered as both the "yes" and "no" edge types; colour comes from data.kind.
export function DecisionEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data } = props;
  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });
  const kind = (data as { kind?: string } | undefined)?.kind === "no" ? "no" : "yes";
  const taken = (data as { taken?: boolean } | undefined)?.taken;
  const color = kind === "yes" ? "#16a34a" : "#dc2626";

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={{ stroke: color, strokeWidth: taken ? 3.5 : 1.75 }} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute rounded px-1.5 py-0.5 text-[11px] font-semibold text-white"
          style={{ background: color, transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {kind.toUpperCase()}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
