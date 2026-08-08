"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

type ForceGraphMethods = {
  zoomToFit: (ms?: number, padding?: number) => void;
};

export type GraphNode = {
  id: string;
  label: string;
  kind: "you" | "club" | "member" | "alum";
  onPath?: boolean;
};
export type GraphLink = { source: string; target: string; onPath?: boolean };

const COLORS: Record<GraphNode["kind"], string> = {
  you: "#3B3BFF",
  club: "#1A1A2E",
  member: "#0A3D62",
  alum: "#7B2D00",
};

export default function NetworkGraph({
  nodes,
  links,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
}) {
  const ref = useRef<ForceGraphMethods | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  const data = useMemo(() => ({ nodes: [...nodes], links: [...links] }), [
    nodes,
    links,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    ref.current?.zoomToFit(500, 50);
  }, []);

  // Re-fit a few times after mount as the simulation settles.
  useEffect(() => {
    const timers = [400, 900, 1600].map((t) => setTimeout(fit, t));
    return () => timers.forEach(clearTimeout);
  }, [fit, data]);

  return (
    <div
      ref={containerRef}
      style={{
        height: 600,
        width: "100%",
        overflow: "hidden",
        borderRadius: 20,
        border: "1px solid #E8E8E3",
        background: "#FFFFFF",
        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      <ForceGraph2D
        ref={ref as never}
        width={size.width}
        height={size.height}
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        cooldownTicks={120}
        onEngineStop={fit}
        linkColor={(l) =>
          (l as GraphLink).onPath ? "#3B3BFF" : "rgba(180,180,170,0.45)"
        }
        linkWidth={(l) => ((l as GraphLink).onPath ? 2.5 : 1)}
        linkDirectionalParticles={(l) => ((l as GraphLink).onPath ? 3 : 0)}
        linkDirectionalParticleSpeed={0.006}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x: number; y: number };
          const r = n.kind === "you" ? 7 : n.kind === "club" ? 5.5 : 4;
          if (n.onPath) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 2.5, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(59,59,255,0.35)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = COLORS[n.kind];
          ctx.fill();
          const fontSize = Math.max(12 / globalScale, 3);
          ctx.font = `600 ${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = "#4A4A44";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(n.label, n.x, n.y + r + 1.5);
        }}
      />
    </div>
  );
}
