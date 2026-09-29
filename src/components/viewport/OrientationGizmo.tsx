import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export type GizmoViewTarget = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'isometric';

interface OrientationGizmoProps {
  camera: THREE.Camera | null;
  onSelectView: (view: GizmoViewTarget) => void;
}

interface AxisItem {
  id: string;
  name: string;
  view: GizmoViewTarget;
  dir: THREE.Vector3;
  color: string;
  hoverColor: string;
  isPositive: boolean;
}

const AXES_CONFIG: AxisItem[] = [
  { id: '+X', name: 'X', view: 'right', dir: new THREE.Vector3(1, 0, 0), color: '#ef4444', hoverColor: '#f87171', isPositive: true },
  { id: '-X', name: '-X', view: 'left', dir: new THREE.Vector3(-1, 0, 0), color: '#b91c1c', hoverColor: '#ef4444', isPositive: false },
  { id: '+Y', name: 'Y', view: 'top', dir: new THREE.Vector3(0, 1, 0), color: '#10b981', hoverColor: '#34d399', isPositive: true },
  { id: '-Y', name: '-Y', view: 'bottom', dir: new THREE.Vector3(0, -1, 0), color: '#047857', hoverColor: '#10b981', isPositive: false },
  { id: '+Z', name: 'Z', view: 'front', dir: new THREE.Vector3(0, 0, 1), color: '#3b82f6', hoverColor: '#60a5fa', isPositive: true },
  { id: '-Z', name: '-Z', view: 'back', dir: new THREE.Vector3(0, 0, -1), color: '#1d4ed8', hoverColor: '#3b82f6', isPositive: false },
];

export const OrientationGizmo: React.FC<OrientationGizmoProps> = ({ camera, onSelectView }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoveredAxisRef = useRef<string | null>(null);
  const [hoveredAxisName, setHoveredAxisName] = useState<string | null>(null);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      if (!camera) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const logicalSize = 96;
      const physicalSize = logicalSize * dpr;

      if (canvas.width !== physicalSize || canvas.height !== physicalSize) {
        canvas.width = physicalSize;
        canvas.height = physicalSize;
        canvas.style.width = `${logicalSize}px`;
        canvas.style.height = `${logicalSize}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, logicalSize, logicalSize);

      const centerX = logicalSize / 2;
      const centerY = logicalSize / 2;
      const radius = 34;

      // Extract camera view rotation
      const mat = new THREE.Matrix4();
      mat.extractRotation(camera.matrixWorldInverse);

      // Project axes to camera space
      const projected = AXES_CONFIG.map((axis) => {
        const v = axis.dir.clone().applyMatrix4(mat);
        return {
          ...axis,
          screenX: centerX + v.x * radius,
          screenY: centerY - v.y * radius,
          depth: v.z, // -1 (closest) to +1 (farthest) in camera space
        };
      });

      // Sort by depth back-to-front
      projected.sort((a, b) => a.depth - b.depth);

      // Draw outer boundary ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw faint center disc
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fillStyle = hoveredAxisRef.current === 'center' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = hoveredAxisRef.current === 'center' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (const item of projected) {
        const isHovered = hoveredAxisRef.current === item.id;
        const color = isHovered ? item.hoverColor : item.color;

        // Draw axis line from center
        if (item.isPositive) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(item.screenX, item.screenY);
          ctx.strokeStyle = color;
          ctx.lineWidth = isHovered ? 3.5 : 2;
          ctx.stroke();
        }

        // Draw node circle
        const nodeRadius = item.isPositive ? (isHovered ? 10 : 8.5) : (isHovered ? 7.5 : 6);
        ctx.beginPath();
        ctx.arc(item.screenX, item.screenY, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = item.isPositive ? color : 'rgba(71, 85, 105, 0.65)';
        ctx.fill();

        // Node border
        ctx.strokeStyle = isHovered ? '#ffffff' : '#090d16';
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.stroke();

        // Node label
        if (item.isPositive) {
          ctx.fillStyle = '#ffffff';
          ctx.font = isHovered ? 'bold 9px "JetBrains Mono", monospace' : 'bold 8px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.name, item.screenX, item.screenY);
        }
      }

      ctx.restore();
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [camera]);

  const getHitTarget = useCallback((clientX: number, clientY: number): GizmoViewTarget | 'center' | null => {
    const canvas = canvasRef.current;
    if (!canvas || !camera) return null;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const logicalSize = 96;
    const centerX = logicalSize / 2;
    const centerY = logicalSize / 2;
    const radius = 34;

    // Check center hit (Isometric toggle)
    if (Math.hypot(clickX - centerX, clickY - centerY) <= 9) {
      return 'isometric';
    }

    const mat = new THREE.Matrix4();
    mat.extractRotation(camera.matrixWorldInverse);

    const projected = AXES_CONFIG.map((axis) => {
      const v = axis.dir.clone().applyMatrix4(mat);
      return {
        id: axis.id,
        view: axis.view,
        x: centerX + v.x * radius,
        y: centerY - v.y * radius,
        depth: v.z,
        isPositive: axis.isPositive,
      };
    });

    // Sort front-to-back
    projected.sort((a, b) => b.depth - a.depth);

    for (const item of projected) {
      const hitRadius = item.isPositive ? 12 : 9;
      if (Math.hypot(clickX - item.x, clickY - item.y) <= hitRadius) {
        return item.view;
      }
    }

    return null;
  }, [camera]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const target = getHitTarget(e.clientX, e.clientY);
    const id = target === 'isometric' ? 'center' : target || null;
    hoveredAxisRef.current = id;
    setHoveredAxisName(target ? target.toUpperCase() : null);
  };

  const handleMouseLeave = () => {
    hoveredAxisRef.current = null;
    setHoveredAxisName(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const target = getHitTarget(e.clientX, e.clientY);
    if (target) {
      const view: GizmoViewTarget = target === 'center' ? 'isometric' : target;
      onSelectView(view);
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none group">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95"
        title="Interactive 3D Orientation Gizmo: Click axes to snap view, click center for Isometric"
      />
      {hoveredAxisName && (
        <div className="absolute -bottom-5 px-1.5 py-0.5 bg-slate-900/90 border border-slate-700 rounded text-[10px] font-mono text-cyan-300 pointer-events-none shadow">
          {hoveredAxisName}
        </div>
      )}
    </div>
  );
};
