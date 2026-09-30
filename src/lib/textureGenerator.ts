import * as THREE from 'three';
import { getMinecraftBlock } from './registry.ts';

// Texture and Icon Caches
const textureCache = new Map<string, THREE.CanvasTexture>();
const dataUrlCache = new Map<string, string>();

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
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

function clamp(val: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, Math.floor(val)));
}

function rgbStr(rgb: RGB, alpha = 1): string {
  return alpha < 1
    ? `rgba(${clamp(rgb.r)}, ${clamp(rgb.g)}, ${clamp(rgb.b)}, ${alpha})`
    : `rgb(${clamp(rgb.r)}, ${clamp(rgb.g)}, ${clamp(rgb.b)})`;
}

function addNoise(ctx: CanvasRenderingContext2D, base: RGB, intensity: number, width = 16, height = 16) {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const delta = (Math.random() - 0.5) * 2 * intensity;
      ctx.fillStyle = rgbStr({
        r: base.r * (1 + delta),
        g: base.g * (1 + delta),
        b: base.b * (1 + delta),
      });
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * Procedurally draws authentic 16x16 Minecraft pixel textures on a 2D canvas.
 */
function renderBlockCanvas(blockId: string, baseHex: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const cleanId = blockId.replace('minecraft:', '').toLowerCase();
  const base = hexToRgb(baseHex || '#808080');

  // Clear canvas
  ctx.clearRect(0, 0, 16, 16);

  // 1. GLASS & STAINED GLASS
  if (cleanId.includes('glass')) {
    const isPink = cleanId.includes('pink');
    const isLightBlue = cleanId.includes('light_blue') || cleanId.includes('cyan');
    const isWhite = cleanId.includes('white');
    const isTinted = cleanId.includes('tinted');

    const frameRgb = isPink
      ? { r: 245, g: 155, b: 180 }
      : isLightBlue
      ? { r: 120, g: 200, b: 245 }
      : isWhite
      ? { r: 240, g: 245, b: 255 }
      : isTinted
      ? { r: 60, g: 45, b: 65 }
      : { r: 210, g: 240, b: 250 };

    const bodyAlpha = isTinted ? 0.65 : 0.25;
    ctx.fillStyle = rgbStr(base, bodyAlpha);
    ctx.fillRect(0, 0, 16, 16);

    // Outer border frame (crisp 1px bevel)
    ctx.fillStyle = rgbStr(frameRgb, 0.85);
    ctx.strokeRect(0.5, 0.5, 15, 15);

    // Diagonal glare highlight streaks (classic Minecraft glass look)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    // Upper-left glare streak
    ctx.fillRect(2, 2, 2, 1);
    ctx.fillRect(3, 3, 3, 1);
    ctx.fillRect(5, 4, 2, 1);
    // Lower-right secondary shine
    ctx.fillRect(10, 11, 2, 1);
    ctx.fillRect(11, 12, 3, 1);
    ctx.fillRect(13, 13, 2, 1);
  }
  // 2. SMOOTH QUARTZ & QUARTZ
  else if (cleanId.includes('quartz')) {
    const isPillar = cleanId.includes('pillar');
    if (isPillar) {
      // Quartz pillar with vertical fluting
      ctx.fillStyle = '#EAE5DE';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#D5D0C9';
      for (let x = 0; x < 16; x += 4) {
        ctx.fillRect(x, 0, 1, 16);
      }
      ctx.fillStyle = '#F5F2EC';
      for (let x = 1; x < 16; x += 4) {
        ctx.fillRect(x, 0, 1, 16);
      }
      // Top and bottom banding
      ctx.fillStyle = '#C8C3BC';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
    } else {
      // Smooth quartz: Elegant cream/white marble block with subtle 1px border bevel
      ctx.fillStyle = '#ECE7DF';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 236, g: 231, b: 223 }, 0.04);
      // Subtle top/left light bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      // Subtle bottom/right shadow bevel
      ctx.fillStyle = 'rgba(180, 175, 165, 0.45)';
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(15, 0, 1, 16);
    }
  }
  // 3. STONE BRICKS (Regular, Mossy, Cracked, Chiseled)
  else if (cleanId.includes('stone_brick') || cleanId.includes('stone_bricks')) {
    const isMossy = cleanId.includes('mossy');
    const isChiseled = cleanId.includes('chiseled');

    // Base stone fill
    ctx.fillStyle = '#787878';
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, { r: 120, g: 120, b: 120 }, 0.08);

    if (isChiseled) {
      // Chiseled concentric square
      ctx.fillStyle = '#505050';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      ctx.strokeRect(3.5, 3.5, 9, 9);
      ctx.fillRect(6, 6, 4, 4);
    } else {
      // 4 horizontal brick courses with staggered mortar
      const mortar = '#424242';
      ctx.fillStyle = mortar;
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(0, 12, 16, 1);
      // Vertical joints
      ctx.fillRect(7, 0, 1, 4);
      ctx.fillRect(15, 0, 1, 4);
      ctx.fillRect(0, 4, 1, 4);
      ctx.fillRect(11, 4, 1, 4);
      ctx.fillRect(5, 8, 1, 4);
      ctx.fillRect(13, 8, 1, 4);
      ctx.fillRect(2, 12, 1, 4);
      ctx.fillRect(9, 12, 1, 4);

      // Highlight edges on brick tops
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(0, 1, 16, 1);
      ctx.fillRect(0, 5, 16, 1);
      ctx.fillRect(0, 9, 16, 1);
      ctx.fillRect(0, 13, 16, 1);

      if (isMossy) {
        // Green moss clusters over mortar and stones
        ctx.fillStyle = '#4D7324';
        ctx.fillRect(2, 3, 3, 2);
        ctx.fillRect(8, 7, 4, 3);
        ctx.fillRect(1, 11, 3, 3);
        ctx.fillRect(12, 2, 3, 2);
        ctx.fillStyle = '#65932D';
        ctx.fillRect(3, 4, 1, 1);
        ctx.fillRect(9, 8, 2, 1);
      }
    }
  }
  // 4. DEEPSLATE (Tiles, Bricks, Cobbled)
  else if (cleanId.includes('deepslate')) {
    ctx.fillStyle = '#39393C';
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, { r: 57, g: 57, b: 60 }, 0.1);
    ctx.fillStyle = '#232326';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(8, 0, 1, 16);
  }
  // 5. COPPER DOORS & OXIDIZED COPPER DOORS
  else if (cleanId.includes('copper_door') || cleanId.includes('door')) {
    const isOxidized = cleanId.includes('oxidized');
    const doorBody = isOxidized ? '#499D82' : '#BE6548';
    const doorFrame = isOxidized ? '#32725D' : '#8B422B';
    const doorGrate = isOxidized ? '#225545' : '#5E2818';

    ctx.fillStyle = doorBody;
    ctx.fillRect(0, 0, 16, 16);
    // Outer door stile/rail frame
    ctx.fillStyle = doorFrame;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.fillRect(0, 7, 16, 2); // Middle lock rail

    // Upper window grate (2x2 grid with dark window slits)
    ctx.fillStyle = doorGrate;
    ctx.fillRect(3, 2, 10, 4);
    ctx.fillStyle = isOxidized ? '#73C8AE' : '#D9896C';
    ctx.fillRect(4, 3, 3, 2);
    ctx.fillRect(9, 3, 3, 2);

    // Lower recessed panel
    ctx.fillStyle = doorFrame;
    ctx.fillRect(3, 10, 10, 4);
    ctx.fillStyle = doorBody;
    ctx.fillRect(4, 11, 8, 2);

    // Brass / copper door knob
    ctx.fillStyle = '#F5B041';
    ctx.fillRect(12, 7, 2, 2);
  }
  // 6. COPPER GRATE
  else if (cleanId.includes('copper_grate') || cleanId.includes('grate')) {
    ctx.fillStyle = cleanId.includes('oxidized') ? '#499D82' : '#BE6548';
    ctx.fillRect(0, 0, 16, 16);
    // Lattice cutout holes
    ctx.clearRect(2, 2, 4, 4);
    ctx.clearRect(10, 2, 4, 4);
    ctx.clearRect(6, 6, 4, 4);
    ctx.clearRect(2, 10, 4, 4);
    ctx.clearRect(10, 10, 4, 4);
  }
  // 7. LEAVES & FOLIAGE
  else if (cleanId.includes('leaves') || cleanId.includes('vine')) {
    const isCherry = cleanId.includes('cherry');
    const isAzalea = cleanId.includes('azalea');
    const isSpruce = cleanId.includes('spruce');

    const leafBase = isCherry
      ? { r: 238, g: 148, b: 172 }
      : isSpruce
      ? { r: 46, g: 83, b: 57 }
      : isAzalea
      ? { r: 95, g: 138, b: 52 }
      : { r: 58, g: 95, b: 28 };

    // Fill base foliage
    ctx.fillStyle = rgbStr(leafBase);
    ctx.fillRect(0, 0, 16, 16);

    // Authentic dappled leaves noise
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = Math.random();
        if (rand < 0.28) {
          // Transparency cutout hole (transparent leaves)
          ctx.clearRect(x, y, 1, 1);
        } else if (rand < 0.55) {
          // Darker leaf shade
          ctx.fillStyle = rgbStr({ r: leafBase.r * 0.72, g: leafBase.g * 0.72, b: leafBase.b * 0.72 });
          ctx.fillRect(x, y, 1, 1);
        } else if (rand > 0.85) {
          // Lighter leaf highlight
          ctx.fillStyle = rgbStr({ r: leafBase.r * 1.25, g: leafBase.g * 1.25, b: leafBase.b * 1.25 });
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Flowering azalea pink blossom clusters
    if (cleanId.includes('flowering')) {
      const flowerColor = '#F26CA7';
      const flowerCenter = '#FFF';
      const flowers = [
        { x: 3, y: 3 },
        { x: 10, y: 5 },
        { x: 5, y: 11 },
        { x: 12, y: 12 },
      ];
      for (const fl of flowers) {
        ctx.fillStyle = flowerColor;
        ctx.fillRect(fl.x - 1, fl.y, 3, 1);
        ctx.fillRect(fl.x, fl.y - 1, 1, 3);
        ctx.fillStyle = flowerCenter;
        ctx.fillRect(fl.x, fl.y, 1, 1);
      }
    }
  }
  // 8. LOGS & WOOD (Spruce, Oak, Cherry, Dark Oak)
  else if (cleanId.includes('log')) {
    const isSpruce = cleanId.includes('spruce');
    const barkDark = isSpruce ? '#2E1E14' : '#3D2817';
    const barkMid = isSpruce ? '#4B3524' : '#6A4A2B';
    const barkLight = isSpruce ? '#5C4230' : '#825C37';

    ctx.fillStyle = barkMid;
    ctx.fillRect(0, 0, 16, 16);
    // Vertical bark strips
    for (let x = 0; x < 16; x += 2) {
      ctx.fillStyle = x % 4 === 0 ? barkDark : barkLight;
      ctx.fillRect(x, 0, 1, 16);
    }
    addNoise(ctx, hexToRgb(barkMid), 0.12);
  }
  // 9. WOOD PLANKS
  else if (cleanId.includes('planks')) {
    const isSpruce = cleanId.includes('spruce');
    const plankBase = isSpruce ? { r: 104, g: 78, b: 50 } : { r: 162, g: 130, b: 78 };
    ctx.fillStyle = rgbStr(plankBase);
    ctx.fillRect(0, 0, 16, 16);

    // Horizontal seams every 4 pixels
    for (let y = 0; y < 16; y += 4) {
      ctx.fillStyle = rgbStr({ r: plankBase.r * 0.65, g: plankBase.g * 0.65, b: plankBase.b * 0.65 });
      ctx.fillRect(0, y, 16, 1);
      // Nail dots
      ctx.fillStyle = '#222';
      ctx.fillRect(2, y + 1, 1, 1);
      ctx.fillRect(13, y + 1, 1, 1);
    }
    addNoise(ctx, plankBase, 0.08);
  }
  // 10. GRASS BLOCK
  else if (cleanId.includes('grass_block')) {
    // Dirt base
    ctx.fillStyle = '#866043';
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, { r: 134, g: 96, b: 67 }, 0.1);
    // Green grass layer on top (top 4 pixels with jagged blade hang)
    ctx.fillStyle = '#619B2E';
    ctx.fillRect(0, 0, 16, 3);
    const blades = [0, 1, 2, 4, 5, 7, 8, 10, 12, 13, 15];
    for (const bx of blades) {
      ctx.fillRect(bx, 3, 1, (bx % 3) + 1);
    }
  }
  // 11. DIRT / MUD
  else if (cleanId.includes('dirt') || cleanId.includes('mud')) {
    ctx.fillStyle = cleanId.includes('mud') ? '#5A4C40' : '#866043';
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, hexToRgb(ctx.fillStyle), 0.15);
  }
  // 12. FLOWERS (Peony, Lilac, Pink Tulip, Allium, Poppy, Dandelion, Orchid)
  else if (
    cleanId.includes('peony') ||
    cleanId.includes('lilac') ||
    cleanId.includes('tulip') ||
    cleanId.includes('allium') ||
    cleanId.includes('poppy') ||
    cleanId.includes('dandelion') ||
    cleanId.includes('orchid')
  ) {
    // Transparent background
    ctx.clearRect(0, 0, 16, 16);

    // Green plant stalk
    ctx.fillStyle = '#4C7D23';
    ctx.fillRect(7, 8, 2, 8);
    // Leaves branching out
    ctx.fillRect(5, 11, 2, 2);
    ctx.fillRect(9, 10, 2, 2);

    // Flower blossom heads
    if (cleanId.includes('peony')) {
      // Large pink peony head
      ctx.fillStyle = '#E598AC';
      ctx.fillRect(5, 2, 6, 6);
      ctx.fillStyle = '#F5BCCD';
      ctx.fillRect(6, 3, 4, 4);
      ctx.fillStyle = '#D47D94';
      ctx.fillRect(7, 4, 2, 2);
    } else if (cleanId.includes('lilac')) {
      // Lavender cone lilac
      ctx.fillStyle = '#B27DB5';
      ctx.fillRect(6, 1, 4, 8);
      ctx.fillStyle = '#C893CB';
      ctx.fillRect(5, 4, 6, 4);
      ctx.fillStyle = '#9E68A1';
      ctx.fillRect(7, 3, 2, 4);
    } else if (cleanId.includes('tulip')) {
      // Pink tulip cup
      ctx.fillStyle = '#EDA8C4';
      ctx.fillRect(5, 3, 6, 5);
      ctx.fillStyle = '#DF7FA2';
      ctx.fillRect(6, 2, 4, 2);
      ctx.clearRect(7, 2, 2, 2); // Tulip petal slit
    } else if (cleanId.includes('allium')) {
      // Magenta pom-pom allium sphere
      ctx.fillStyle = '#A260A8';
      ctx.fillRect(5, 2, 6, 6);
      ctx.fillStyle = '#BF7AC5';
      ctx.fillRect(6, 3, 4, 4);
      ctx.fillStyle = '#894690';
      ctx.fillRect(4, 4, 8, 2);
    } else {
      // Generic vibrant flower
      ctx.fillStyle = rgbStr(base);
      ctx.fillRect(5, 3, 6, 5);
      ctx.fillStyle = '#FFEE55';
      ctx.fillRect(7, 5, 2, 2);
    }
  }
  // 13. SHORT GRASS
  else if (cleanId.includes('short_grass') || cleanId.includes('grass')) {
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = '#5B8731';
    // Natural tall grass blades
    ctx.fillRect(7, 6, 2, 10);
    ctx.fillRect(5, 8, 2, 8);
    ctx.fillRect(9, 9, 2, 7);
    ctx.fillRect(3, 11, 2, 5);
    ctx.fillRect(11, 11, 2, 5);
    ctx.fillStyle = '#78AB42';
    ctx.fillRect(7, 6, 1, 4);
    ctx.fillRect(5, 8, 1, 4);
  }
  // 14. LANTERN
  else if (cleanId.includes('lantern')) {
    ctx.clearRect(0, 0, 16, 16);
    // Dark iron cage frame
    ctx.fillStyle = '#222224';
    ctx.fillRect(4, 2, 8, 2); // Cap
    ctx.fillRect(3, 4, 10, 1);
    ctx.fillRect(3, 4, 2, 10); // Left strut
    ctx.fillRect(11, 4, 2, 10); // Right strut
    ctx.fillRect(3, 14, 10, 2); // Base
    ctx.fillRect(7, 0, 2, 2); // Chain loop
    // Glowing warm core
    ctx.fillStyle = '#F5B041';
    ctx.fillRect(5, 5, 6, 8);
    ctx.fillStyle = '#FEF9E7';
    ctx.fillRect(6, 7, 4, 4);
  }
  // 15. DEFAULT / OTHER MASONRY (Cobblestone, Smooth Stone, Wool, Concrete, etc.)
  else {
    ctx.fillStyle = rgbStr(base);
    ctx.fillRect(0, 0, 16, 16);

    if (cleanId.includes('cobble')) {
      // Cobblestone cluster pattern
      const stones = [
        { x: 1, y: 1, w: 6, h: 5 },
        { x: 8, y: 2, w: 7, h: 4 },
        { x: 2, y: 7, w: 5, h: 4 },
        { x: 8, y: 7, w: 6, h: 4 },
        { x: 1, y: 12, w: 6, h: 3 },
        { x: 8, y: 12, w: 7, h: 3 },
      ];
      ctx.fillStyle = rgbStr({ r: base.r * 0.55, g: base.g * 0.55, b: base.b * 0.55 });
      ctx.fillRect(0, 0, 16, 16);
      for (const s of stones) {
        ctx.fillStyle = rgbStr({ r: base.r * 0.9, g: base.g * 0.9, b: base.b * 0.9 });
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
      addNoise(ctx, base, 0.1);
    } else {
      addNoise(ctx, base, 0.08);
      // Subtle 1px border highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(15, 0, 1, 16);
    }
  }

  return canvas;
}

/**
 * Returns or generates a cached THREE.CanvasTexture for Three.js 3D viewport rendering.
 */
export function getOrCreateBlockTexture(
  blockIdOrTextureType: string,
  baseColorHex?: string
): THREE.CanvasTexture {
  const cleanId = blockIdOrTextureType.startsWith('minecraft:')
    ? blockIdOrTextureType
    : `minecraft:${blockIdOrTextureType}`;

  const def = getMinecraftBlock(cleanId);
  const color = baseColorHex || def?.colorHex || '#808080';
  const cacheKey = `${cleanId}_${color}`;

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = renderBlockCanvas(cleanId, color);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Returns a cached data URL (PNG) of the 16x16 Minecraft block icon for UI swatches.
 */
export function getBlockIconDataUrl(blockId: string): string {
  const cleanId = blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;
  if (dataUrlCache.has(cleanId)) {
    return dataUrlCache.get(cleanId)!;
  }

  const def = getMinecraftBlock(cleanId);
  const color = def?.colorHex || '#808080';
  const canvas = renderBlockCanvas(cleanId, color);
  const dataUrl = canvas.toDataURL('image/png');

  dataUrlCache.set(cleanId, dataUrl);
  return dataUrl;
}
