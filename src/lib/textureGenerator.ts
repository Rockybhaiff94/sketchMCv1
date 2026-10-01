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
 * Creates an environment-safe canvas (browser or Node.js mock)
 */
function createCanvas(width = 16, height = 16): HTMLCanvasElement {
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }
  // Node.js mock canvas for deterministic test suites
  const dummyCtx: any = {
    imageSmoothingEnabled: false,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    createImageData: () => ({ data: new Uint8ClampedArray(width * height * 4) }),
    getImageData: () => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: () => {},
  };
  return {
    width,
    height,
    getContext: () => dummyCtx,
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA',
  } as unknown as HTMLCanvasElement;
}

/**
 * Procedurally draws authentic 16x16 Minecraft pixel textures on a 2D canvas.
 */
export function renderBlockCanvas(blockId: string, baseHex: string): HTMLCanvasElement {
  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const cleanId = blockId.replace('minecraft:', '').toLowerCase();
  const base = hexToRgb(baseHex || '#808080');

  // Clear canvas
  ctx.clearRect(0, 0, 16, 16);

  // 1. GLASS & STAINED GLASS & GLASS PANE
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

    const bodyAlpha = isTinted ? 0.65 : isPink ? 0.35 : 0.22;
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
      ctx.fillStyle = '#C8C3BC';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
    } else if (cleanId.includes('smooth')) {
      // Smooth quartz: Elegant cream/white marble block with subtle 1px border bevel
      ctx.fillStyle = '#ECE7DF';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 236, g: 231, b: 223 }, 0.04);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillStyle = 'rgba(180, 175, 165, 0.45)';
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(15, 0, 1, 16);
    } else {
      // Standard quartz block with subtle framed panel
      ctx.fillStyle = '#EBE5DE';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 235, g: 229, b: 222 }, 0.05);
      ctx.fillStyle = '#D7D1C9';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      ctx.fillStyle = '#F8F6F1';
      ctx.strokeRect(0.5, 0.5, 15, 15);
    }
  }
  // 3. STONE BRICKS (Regular, Mossy, Cracked, Chiseled)
  else if (cleanId.includes('stone_brick') || cleanId.includes('stone_bricks')) {
    const isMossy = cleanId.includes('mossy');
    const isChiseled = cleanId.includes('chiseled');

    ctx.fillStyle = '#787878';
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, { r: 120, g: 120, b: 120 }, 0.08);

    if (isChiseled) {
      ctx.fillStyle = '#505050';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      ctx.strokeRect(3.5, 3.5, 9, 9);
      ctx.fillRect(6, 6, 4, 4);
    } else {
      const mortar = '#424242';
      ctx.fillStyle = mortar;
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(0, 12, 16, 1);
      ctx.fillRect(7, 0, 1, 4);
      ctx.fillRect(15, 0, 1, 4);
      ctx.fillRect(0, 4, 1, 4);
      ctx.fillRect(11, 4, 1, 4);
      ctx.fillRect(5, 8, 1, 4);
      ctx.fillRect(13, 8, 1, 4);
      ctx.fillRect(2, 12, 1, 4);
      ctx.fillRect(9, 12, 1, 4);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(0, 1, 16, 1);
      ctx.fillRect(0, 5, 16, 1);
      ctx.fillRect(0, 9, 16, 1);
      ctx.fillRect(0, 13, 16, 1);

      if (isMossy) {
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
  // 4. DEEPSLATE TILES vs BRICKS vs RAW
  else if (cleanId.includes('deepslate')) {
    if (cleanId.includes('tile')) {
      // Deepslate Tiles: Distinct 2x2 large square stone tiles
      ctx.fillStyle = '#343437';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 52, g: 52, b: 55 }, 0.08);
      // Dark grout cross
      ctx.fillStyle = '#1D1D20';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(8, 0, 1, 16);
      // Top/Left highlight bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(1, 1, 7, 1);
      ctx.fillRect(9, 1, 7, 1);
      ctx.fillRect(1, 9, 7, 1);
      ctx.fillRect(9, 9, 7, 1);
    } else if (cleanId.includes('brick')) {
      // Deepslate Bricks: 4 staggered courses of dark bricks
      ctx.fillStyle = '#39393C';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 57, g: 57, b: 60 }, 0.08);
      ctx.fillStyle = '#212124';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(0, 12, 16, 1);
      ctx.fillRect(8, 0, 1, 4);
      ctx.fillRect(4, 4, 1, 4);
      ctx.fillRect(12, 4, 1, 4);
      ctx.fillRect(7, 8, 1, 4);
      ctx.fillRect(3, 12, 1, 4);
      ctx.fillRect(11, 12, 1, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, 1, 16, 1);
      ctx.fillRect(0, 5, 16, 1);
      ctx.fillRect(0, 9, 16, 1);
      ctx.fillRect(0, 13, 16, 1);
    } else {
      // Raw or polished deepslate: Strata band streaks
      ctx.fillStyle = '#39393C';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 57, g: 57, b: 60 }, 0.1);
      ctx.fillStyle = '#2A2A2D';
      ctx.fillRect(0, 3, 16, 2);
      ctx.fillRect(0, 9, 16, 3);
      ctx.fillRect(0, 14, 16, 2);
      ctx.fillStyle = '#4A4A4E';
      ctx.fillRect(0, 5, 16, 1);
      ctx.fillRect(0, 12, 16, 1);
    }
  }
  // 5. BLACKSTONE vs BLACKSTONE BRICKS
  else if (cleanId.includes('blackstone')) {
    if (cleanId.includes('brick')) {
      // Blackstone bricks
      ctx.fillStyle = '#221E1A';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 34, g: 30, b: 26 }, 0.1);
      ctx.fillStyle = '#14120F';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(0, 12, 16, 1);
      ctx.fillRect(7, 0, 1, 4);
      ctx.fillRect(3, 4, 1, 4);
      ctx.fillRect(11, 4, 1, 4);
      ctx.fillRect(8, 8, 1, 4);
      ctx.fillRect(4, 12, 1, 4);
      ctx.fillRect(12, 12, 1, 4);
    } else {
      // Dark pitted volcanic nether stone
      ctx.fillStyle = '#27221C';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 39, g: 34, b: 28 }, 0.15);
      ctx.fillStyle = '#1A1612';
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillRect(10, 5, 3, 2);
      ctx.fillRect(5, 11, 2, 3);
      ctx.fillRect(12, 12, 2, 2);
    }
  }
  // 6. WOOL (White, Pink, Colored)
  else if (cleanId.includes('wool')) {
    const woolBase = cleanId.includes('pink')
      ? { r: 243, g: 139, b: 170 }
      : cleanId.includes('white')
      ? { r: 232, g: 232, b: 232 }
      : base;
    ctx.fillStyle = rgbStr(woolBase);
    ctx.fillRect(0, 0, 16, 16);
    // Knitted textile pattern
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = rgbStr({ r: woolBase.r * 0.94, g: woolBase.g * 0.94, b: woolBase.b * 0.94 });
          ctx.fillRect(x, y, 1, 1);
        } else if ((x * y) % 5 === 0) {
          ctx.fillStyle = rgbStr({ r: woolBase.r * 1.05, g: woolBase.g * 1.05, b: woolBase.b * 1.05 });
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
  // 7. SAND
  else if (cleanId === 'sand' || cleanId.includes('sand') && !cleanId.includes('sandstone')) {
    const sandBase = { r: 219, g: 211, b: 160 };
    ctx.fillStyle = rgbStr(sandBase);
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, sandBase, 0.08);
    // Subtle wavy desert wind ripples
    ctx.fillStyle = '#D3C78B';
    ctx.fillRect(0, 3, 8, 1);
    ctx.fillRect(7, 4, 9, 1);
    ctx.fillRect(2, 9, 7, 1);
    ctx.fillRect(8, 10, 8, 1);
    ctx.fillRect(0, 14, 6, 1);
    ctx.fillRect(5, 15, 11, 1);
  }
  // 8. REDSTONE BLOCK
  else if (cleanId.includes('redstone')) {
    ctx.fillStyle = '#B80808';
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, { r: 184, g: 8, b: 8 }, 0.15);
    // Ruby crystal facets and micro-glints
    ctx.fillStyle = '#EE1818';
    ctx.fillRect(2, 2, 4, 3);
    ctx.fillRect(9, 3, 3, 4);
    ctx.fillRect(3, 9, 5, 4);
    ctx.fillRect(10, 10, 4, 3);
    ctx.fillStyle = '#FF5555';
    ctx.fillRect(3, 3, 2, 1);
    ctx.fillRect(10, 4, 1, 2);
    ctx.fillRect(4, 10, 2, 1);
    ctx.fillStyle = '#780000';
    ctx.strokeRect(0.5, 0.5, 15, 15);
  }
  // 9. TORCH
  else if (cleanId.includes('torch')) {
    ctx.clearRect(0, 0, 16, 16);
    // Wooden stick post
    ctx.fillStyle = '#5A4328';
    ctx.fillRect(7, 6, 2, 10);
    ctx.fillStyle = '#785A38';
    ctx.fillRect(7, 7, 1, 8);
    // Charred top tip
    ctx.fillStyle = '#222222';
    ctx.fillRect(7, 5, 2, 1);
    // Glowing warm fire flame
    ctx.fillStyle = '#E65100';
    ctx.fillRect(6, 2, 4, 4);
    ctx.fillStyle = '#FFA000';
    ctx.fillRect(7, 2, 2, 3);
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(7, 3, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(7, 3, 1, 1);
  }
  // 10. IRON BARS
  else if (cleanId.includes('iron_bars')) {
    ctx.clearRect(0, 0, 16, 16);
    // 2 vertical metallic bars with cross struts
    const barColor = '#8A8A8E';
    const barHighlight = '#B5B5B8';
    const barDark = '#4A4A4D';

    // Horizontal top & bottom rails
    ctx.fillStyle = barColor;
    ctx.fillRect(0, 2, 16, 2);
    ctx.fillRect(0, 12, 16, 2);
    // Vertical bars
    ctx.fillRect(3, 0, 3, 16);
    ctx.fillRect(10, 0, 3, 16);

    // Bevel highlights
    ctx.fillStyle = barHighlight;
    ctx.fillRect(3, 0, 1, 16);
    ctx.fillRect(10, 0, 1, 16);
    ctx.fillRect(0, 2, 16, 1);
    ctx.fillRect(0, 12, 16, 1);

    // Shadows
    ctx.fillStyle = barDark;
    ctx.fillRect(5, 0, 1, 16);
    ctx.fillRect(12, 0, 1, 16);
  }
  // 11. DOORS (Oak Door, Copper Door, etc.)
  else if (cleanId.includes('door')) {
    const isCopper = cleanId.includes('copper');
    const isOxidized = cleanId.includes('oxidized');
    const doorBody = isCopper ? (isOxidized ? '#499D82' : '#BE6548') : '#A26F3E';
    const doorFrame = isCopper ? (isOxidized ? '#32725D' : '#8B422B') : '#784E25';
    const doorGrate = isCopper ? (isOxidized ? '#225545' : '#5E2818') : '#2D1B0D';

    ctx.fillStyle = doorBody;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = doorFrame;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.fillRect(0, 7, 16, 2);

    // Upper window cutout panes
    ctx.fillStyle = doorGrate;
    ctx.fillRect(3, 2, 10, 4);
    ctx.clearRect(4, 3, 3, 2);
    ctx.clearRect(9, 3, 3, 2);

    // Lower panel
    ctx.fillStyle = doorFrame;
    ctx.fillRect(3, 10, 10, 4);
    ctx.fillStyle = doorBody;
    ctx.fillRect(4, 11, 8, 2);

    // Door knob
    ctx.fillStyle = '#F5B041';
    ctx.fillRect(12, 7, 2, 2);
  }
  // 12. TRAPDOOR
  else if (cleanId.includes('trapdoor')) {
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#613E1B';
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.fillRect(7, 0, 2, 16);
    ctx.fillRect(0, 7, 16, 2);
    // 4 open recessed square slits
    ctx.fillStyle = '#42280E';
    ctx.fillRect(2, 2, 4, 4);
    ctx.fillRect(10, 2, 4, 4);
    ctx.fillRect(2, 10, 4, 4);
    ctx.fillRect(10, 10, 4, 4);
  }
  // 13. LOGS & WOOD (Side bark vs Top concentric rings)
  else if (cleanId.includes('log')) {
    const isTop = cleanId.includes('top') || cleanId.includes('end');
    const isSpruce = cleanId.includes('spruce');

    if (isTop) {
      // Concentric growth rings
      const barkOuter = isSpruce ? '#2E1E14' : '#3D2817';
      const woodRing1 = isSpruce ? '#765C39' : '#B39264';
      const woodRing2 = isSpruce ? '#5C4230' : '#9E7E52';
      const woodPith = isSpruce ? '#4A3420' : '#7D5C32';

      ctx.fillStyle = woodRing1;
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = barkOuter;
      ctx.strokeRect(0.5, 0.5, 15, 15);
      ctx.fillStyle = woodRing2;
      ctx.strokeRect(2.5, 2.5, 11, 11);
      ctx.strokeRect(5.5, 5.5, 5, 5);
      ctx.fillStyle = woodPith;
      ctx.fillRect(7, 7, 2, 2);
    } else {
      // Vertical bark strips
      const barkDark = isSpruce ? '#2E1E14' : '#3D2817';
      const barkMid = isSpruce ? '#4B3524' : '#6A4A2B';
      const barkLight = isSpruce ? '#5C4230' : '#825C37';

      ctx.fillStyle = barkMid;
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x += 2) {
        ctx.fillStyle = x % 4 === 0 ? barkDark : barkLight;
        ctx.fillRect(x, 0, 1, 16);
      }
      addNoise(ctx, hexToRgb(barkMid), 0.12);
    }
  }
  // 14. WOOD PLANKS / STAIRS / SLABS / FENCES
  else if (
    cleanId.includes('planks') ||
    cleanId.includes('stairs') ||
    cleanId.includes('slab') ||
    cleanId.includes('fence')
  ) {
    const isSpruce = cleanId.includes('spruce');
    const isDarkOak = cleanId.includes('dark_oak');
    const plankBase = isDarkOak
      ? { r: 66, g: 43, b: 20 }
      : isSpruce
      ? { r: 104, g: 78, b: 50 }
      : { r: 162, g: 130, b: 78 };

    ctx.fillStyle = rgbStr(plankBase);
    ctx.fillRect(0, 0, 16, 16);

    for (let y = 0; y < 16; y += 4) {
      ctx.fillStyle = rgbStr({ r: plankBase.r * 0.65, g: plankBase.g * 0.65, b: plankBase.b * 0.65 });
      ctx.fillRect(0, y, 16, 1);
      ctx.fillStyle = '#222';
      ctx.fillRect(2, y + 1, 1, 1);
      ctx.fillRect(13, y + 1, 1, 1);
    }
    addNoise(ctx, plankBase, 0.08);
  }
  // 15. GRASS BLOCK (Top vs Side)
  else if (cleanId.includes('grass_block')) {
    if (cleanId.includes('top')) {
      // Pure lush grass carpet
      ctx.fillStyle = '#5B8731';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 91, g: 135, b: 49 }, 0.12);
    } else {
      // Dirt base with hanging grass fringe
      ctx.fillStyle = '#866043';
      ctx.fillRect(0, 0, 16, 16);
      addNoise(ctx, { r: 134, g: 96, b: 67 }, 0.1);
      ctx.fillStyle = '#619B2E';
      ctx.fillRect(0, 0, 16, 3);
      const blades = [0, 1, 2, 4, 5, 7, 8, 10, 12, 13, 15];
      for (const bx of blades) {
        ctx.fillRect(bx, 3, 1, (bx % 3) + 1);
      }
    }
  }
  // 16. DIRT / MUD
  else if (cleanId.includes('dirt') || cleanId.includes('mud')) {
    ctx.fillStyle = cleanId.includes('mud') ? '#5A4C40' : '#866043';
    ctx.fillRect(0, 0, 16, 16);
    addNoise(ctx, hexToRgb(ctx.fillStyle), 0.15);
  }
  // 17. LEAVES & VINES
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

    ctx.fillStyle = rgbStr(leafBase);
    ctx.fillRect(0, 0, 16, 16);

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = Math.random();
        if (rand < 0.28) {
          ctx.clearRect(x, y, 1, 1);
        } else if (rand < 0.55) {
          ctx.fillStyle = rgbStr({ r: leafBase.r * 0.72, g: leafBase.g * 0.72, b: leafBase.b * 0.72 });
          ctx.fillRect(x, y, 1, 1);
        } else if (rand > 0.85) {
          ctx.fillStyle = rgbStr({ r: leafBase.r * 1.25, g: leafBase.g * 1.25, b: leafBase.b * 1.25 });
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
  // 18. LANTERN
  else if (cleanId.includes('lantern')) {
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = '#222224';
    ctx.fillRect(4, 2, 8, 2);
    ctx.fillRect(3, 4, 10, 1);
    ctx.fillRect(3, 4, 2, 10);
    ctx.fillRect(11, 4, 2, 10);
    ctx.fillRect(3, 14, 10, 2);
    ctx.fillRect(7, 0, 2, 2);
    ctx.fillStyle = '#F5B041';
    ctx.fillRect(5, 5, 6, 8);
    ctx.fillStyle = '#FEF9E7';
    ctx.fillRect(6, 7, 4, 4);
  }
  // 19. STONE & COBBLESTONE & DEFAULT MASONRY
  else {
    ctx.fillStyle = rgbStr(base);
    ctx.fillRect(0, 0, 16, 16);

    if (cleanId.includes('cobble') || cleanId.includes('wall')) {
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
 * Returns or generates a cached THREE.CanvasTexture with authentic Minecraft pixel filtering and sRGB encoding.
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
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Returns multi-face textures for blocks that require differentiated faces (e.g. Grass Block, Oak Log).
 * Order matches Three.js BoxGeometry groups: [+X, -X, +Y, -Y, +Z, -Z]
 */
export function getMultiFaceTextures(
  blockId: string,
  state?: Record<string, string>
): THREE.CanvasTexture[] | null {
  const cleanId = blockId.replace('minecraft:', '').toLowerCase();

  // Grass Block: +Y = top green, -Y = dirt, sides (+X, -X, +Z, -Z) = side fringe
  if (cleanId === 'grass_block') {
    const top = getOrCreateBlockTexture('minecraft:grass_block_top', '#5B8731');
    const bottom = getOrCreateBlockTexture('minecraft:dirt', '#866043');
    const side = getOrCreateBlockTexture('minecraft:grass_block_side', '#866043');
    return [side, side, top, bottom, side, side];
  }

  // Logs: Rings on log ends, Bark on sides
  if (cleanId.includes('log') && !cleanId.includes('plank')) {
    const side = getOrCreateBlockTexture(`${cleanId}_side`, '#6A4A2B');
    const end = getOrCreateBlockTexture(`${cleanId}_top`, '#B39264');
    const axis = state?.axis || 'y';

    if (axis === 'x') {
      // +X, -X are ends, others are bark
      return [end, end, side, side, side, side];
    } else if (axis === 'z') {
      // +Z, -Z are ends, others are bark
      return [side, side, side, side, end, end];
    } else {
      // Default 'y': +Y, -Y are ends, others are bark
      return [side, side, end, end, side, side];
    }
  }

  return null;
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
