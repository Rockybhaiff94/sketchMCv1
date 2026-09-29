import * as THREE from 'three';

// Cache generated canvas textures so we only create each texture once
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedurally generates authentic 16x16 pixel-grid Minecraft textures.
 * Uses THREE.NearestFilter for pixel-crisp Minecraft aesthetic without external assets.
 */
export function getOrCreateBlockTexture(
  textureType: string,
  baseColorHex: string,
  accentColorHex?: string
): THREE.CanvasTexture {
  const cacheKey = `${textureType}_${baseColorHex}_${accentColorHex || ''}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Helper to parse hex to RGB
  const base = hexToRgb(baseColorHex);
  const accent = accentColorHex ? hexToRgb(accentColorHex) : { r: base.r * 0.8, g: base.g * 0.8, b: base.b * 0.8 };

  // Fill base
  ctx.fillStyle = `rgb(${base.r}, ${base.g}, ${base.b})`;
  ctx.fillRect(0, 0, 16, 16);

  if (textureType === 'stone_bricks') {
    // 4 horizontal brick rows with mortar lines
    ctx.fillStyle = `rgb(${Math.floor(base.r * 0.65)}, ${Math.floor(base.g * 0.65)}, ${Math.floor(base.b * 0.65)})`;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 4, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(0, 12, 16, 1);
    // Vertical joints staggered
    ctx.fillRect(8, 0, 1, 4);
    ctx.fillRect(0, 4, 1, 4);
    ctx.fillRect(12, 4, 1, 4);
    ctx.fillRect(6, 8, 1, 4);
    ctx.fillRect(2, 12, 1, 4);
    ctx.fillRect(10, 12, 1, 4);

    // Subtle noise on brick faces
    addNoise(ctx, base, 0.12);
  } else if (textureType === 'planks') {
    // Horizontal wood plank seams every 4 pixels
    for (let y = 0; y < 16; y += 4) {
      ctx.fillStyle = `rgb(${Math.floor(base.r * 0.7)}, ${Math.floor(base.g * 0.7)}, ${Math.floor(base.b * 0.7)})`;
      ctx.fillRect(0, y, 16, 1);
      // Nail details
      ctx.fillStyle = `rgb(${Math.floor(base.r * 0.5)}, ${Math.floor(base.g * 0.5)}, ${Math.floor(base.b * 0.5)})`;
      ctx.fillRect(2, y + 1, 1, 1);
      ctx.fillRect(13, y + 1, 1, 1);
    }
    // Grain noise
    addWoodGrain(ctx, base);
  } else if (textureType === 'cobblestone') {
    // Irregular stone clusters
    addCobblestonePattern(ctx, base);
  } else if (textureType === 'log') {
    // Vertical bark grain
    for (let x = 0; x < 16; x += 2) {
      const shade = x % 4 === 0 ? 0.75 : 0.9;
      ctx.fillStyle = `rgb(${Math.floor(base.r * shade)}, ${Math.floor(base.g * shade)}, ${Math.floor(base.b * shade)})`;
      ctx.fillRect(x, 0, 1, 16);
    }
    addNoise(ctx, base, 0.15);
  } else if (textureType === 'deepslate_tiles') {
    // Dark tiled grid with beveled borders
    ctx.fillStyle = `rgb(${Math.floor(base.r * 0.6)}, ${Math.floor(base.g * 0.6)}, ${Math.floor(base.b * 0.6)})`;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(8, 0, 1, 16);
    addNoise(ctx, base, 0.1);
  } else if (textureType === 'glass') {
    // Clear cyan glass border + diagonal glare streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeRect(0.5, 0.5, 15, 15);
    // Glare line
    ctx.fillRect(3, 3, 2, 2);
    ctx.fillRect(4, 4, 3, 1);
    ctx.fillRect(10, 11, 2, 2);
  } else if (textureType === 'lantern') {
    // Glowing center with dark iron rim
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 16, 3);
    ctx.fillRect(0, 13, 16, 3);
    ctx.fillRect(0, 0, 3, 16);
    ctx.fillRect(13, 0, 3, 16);
    // Warm flame core
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(5, 5, 6, 6);
  } else {
    // Default stone / generic texture with subtle voxel noise
    addNoise(ctx, base, 0.1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  textureCache.set(cacheKey, texture);
  return texture;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function addNoise(ctx: CanvasRenderingContext2D, base: { r: number; g: number; b: number }, intensity: number) {
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const delta = (Math.random() - 0.5) * 2 * intensity;
      const r = Math.max(0, Math.min(255, Math.floor(base.r * (1 + delta))));
      const g = Math.max(0, Math.min(255, Math.floor(base.g * (1 + delta))));
      const b = Math.max(0, Math.min(255, Math.floor(base.b * (1 + delta))));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function addWoodGrain(ctx: CanvasRenderingContext2D, base: { r: number; g: number; b: number }) {
  for (let y = 0; y < 16; y++) {
    if (y % 4 === 0) continue; // Skip plank seam
    for (let x = 0; x < 16; x++) {
      const delta = (Math.sin(x * 0.8 + y * 0.4) * 0.08) + (Math.random() - 0.5) * 0.08;
      const r = Math.max(0, Math.min(255, Math.floor(base.r * (1 + delta))));
      const g = Math.max(0, Math.min(255, Math.floor(base.g * (1 + delta))));
      const b = Math.max(0, Math.min(255, Math.floor(base.b * (1 + delta))));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function addCobblestonePattern(ctx: CanvasRenderingContext2D, base: { r: number; g: number; b: number }) {
  const stones = [
    { x: 1, y: 1, w: 6, h: 5 },
    { x: 8, y: 2, w: 7, h: 4 },
    { x: 2, y: 7, w: 5, h: 4 },
    { x: 8, y: 7, w: 6, h: 4 },
    { x: 1, y: 12, w: 6, h: 3 },
    { x: 8, y: 12, w: 7, h: 3 },
  ];

  ctx.fillStyle = `rgb(${Math.floor(base.r * 0.55)}, ${Math.floor(base.g * 0.55)}, ${Math.floor(base.b * 0.55)})`;
  ctx.fillRect(0, 0, 16, 16);

  for (const s of stones) {
    const shade = 0.85 + Math.random() * 0.25;
    ctx.fillStyle = `rgb(${Math.floor(base.r * shade)}, ${Math.floor(base.g * shade)}, ${Math.floor(base.b * shade)})`;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
  addNoise(ctx, base, 0.08);
}
