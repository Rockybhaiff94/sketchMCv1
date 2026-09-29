import { gzip } from 'pako';
import { MinecraftBuild, BlockPlacement } from '../types/minecraft.ts';
import { getMinecraftBlock } from './registry.ts';

export interface MaterialCount {
  blockId: string;
  name: string;
  count: number;
  stacks: number;
  remainder: number;
  colorHex: string;
}

export interface MaterialBOM {
  totalBlocks: number;
  items: MaterialCount[];
  totalStacks: number;
  singleChestsNeeded: number; // 27 slots
  doubleChestsNeeded: number; // 54 slots
}

/**
 * Calculates accurate Material Bill of Materials with stack counts (64 per stack).
 */
export function calculateMaterialBOM(build: MinecraftBuild): MaterialBOM {
  const counts = new Map<string, number>();

  for (const b of build.blocks) {
    counts.set(b.blockId, (counts.get(b.blockId) || 0) + 1);
  }

  const items: MaterialCount[] = [];
  let totalBlocks = 0;
  let totalStacks = 0;

  for (const [blockId, count] of counts.entries()) {
    const def = getMinecraftBlock(blockId);
    const stacks = Math.floor(count / 64);
    const remainder = count % 64;
    totalBlocks += count;
    totalStacks += stacks + (remainder > 0 ? 1 : 0);

    items.push({
      blockId,
      name: def?.name || blockId.replace('minecraft:', ''),
      count,
      stacks,
      remainder,
      colorHex: def?.colorHex || '#888888',
    });
  }

  // Sort by highest count
  items.sort((a, b) => b.count - a.count);

  return {
    totalBlocks,
    items,
    totalStacks,
    singleChestsNeeded: Math.ceil(totalStacks / 27),
    doubleChestsNeeded: Math.ceil(totalStacks / 54),
  };
}

/**
 * Serializes block placement to standard Minecraft block state string:
 * e.g. "minecraft:oak_stairs[facing=north,half=bottom,shape=straight]"
 */
export function formatBlockStateString(block: BlockPlacement): string {
  if (!block.state || Object.keys(block.state).length === 0) {
    return block.blockId;
  }
  const entries = Object.entries(block.state)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return `${block.blockId}[${entries}]`;
}

/**
 * Exports to Sponge/WorldEdit .schem format (Version 2 specification).
 * Returns a GZipped Uint8Array ready for download as .schem.
 */
export function exportToWorldEditSchematic(build: MinecraftBuild): Uint8Array {
  // Normalize positions to 0..width-1, 0..height-1, 0..depth-1
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const b of build.blocks) {
    if (b.position.x < minX) minX = b.position.x;
    if (b.position.y < minY) minY = b.position.y;
    if (b.position.z < minZ) minZ = b.position.z;
    if (b.position.x > maxX) maxX = b.position.x;
    if (b.position.y > maxY) maxY = b.position.y;
    if (b.position.z > maxZ) maxZ = b.position.z;
  }

  const width = Math.max(1, maxX - minX + 1);
  const height = Math.max(1, maxY - minY + 1);
  const length = Math.max(1, maxZ - minZ + 1);

  // Palette: map block state string -> palette index
  const palette = new Map<string, number>();
  palette.set('minecraft:air', 0);
  let nextPaletteId = 1;

  // 3D array: index = (y * length + z) * width + x
  const totalVolume = width * height * length;
  const blockIndices = new Uint32Array(totalVolume); // Defaults to 0 (air)

  for (const b of build.blocks) {
    const x = b.position.x - minX;
    const y = b.position.y - minY;
    const z = b.position.z - minZ;

    if (x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < length) {
      const stateStr = formatBlockStateString(b);
      let palId = palette.get(stateStr);
      if (palId === undefined) {
        palId = nextPaletteId++;
        palette.set(stateStr, palId);
      }
      const idx = (y * length + z) * width + x;
      blockIndices[idx] = palId;
    }
  }

  // Encode BlockData as VarInt byte stream
  const blockDataBytes: number[] = [];
  for (let i = 0; i < totalVolume; i++) {
    let val = blockIndices[i];
    while ((val & -128) !== 0) {
      blockDataBytes.push((val & 127) | 128);
      val >>>= 7;
    }
    blockDataBytes.push(val);
  }

  // Construct NBT Byte Buffer
  const nbtBytes = writeSpongeSchematicNBT({
    version: 2,
    dataVersion: build.version === '1.21' ? 3953 : 3465,
    width,
    height,
    length,
    palette,
    blockData: new Uint8Array(blockDataBytes),
    metadata: {
      name: build.name,
      author: 'VoxelForge AI Engine',
      date: build.metadata.createdAt,
    },
  });

  // Gzip compress NBT payload
  return gzip(nbtBytes);
}

/**
 * Minimal binary NBT writer for Sponge Schematic format.
 */
function writeSpongeSchematicNBT(schem: {
  version: number;
  dataVersion: number;
  width: number;
  height: number;
  length: number;
  palette: Map<string, number>;
  blockData: Uint8Array;
  metadata: { name: string; author: string; date: string };
}): Uint8Array {
  const buffer: number[] = [];

  const writeByte = (b: number) => buffer.push(b & 0xff);
  const writeShort = (s: number) => {
    buffer.push((s >> 8) & 0xff);
    buffer.push(s & 0xff);
  };
  const writeInt = (i: number) => {
    buffer.push((i >> 24) & 0xff);
    buffer.push((i >> 16) & 0xff);
    buffer.push((i >> 8) & 0xff);
    buffer.push(i & 0xff);
  };
  const writeString = (str: string) => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    writeShort(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer.push(bytes[i]);
  };

  // Root Compound Tag: 0x0A, Name: "Schematic"
  writeByte(0x0a);
  writeString('Schematic');

  // Tag_Int: "Version"
  writeByte(0x03);
  writeString('Version');
  writeInt(schem.version);

  // Tag_Int: "DataVersion"
  writeByte(0x03);
  writeString('DataVersion');
  writeInt(schem.dataVersion);

  // Tag_Short: "Width"
  writeByte(0x02);
  writeString('Width');
  writeShort(schem.width);

  // Tag_Short: "Height"
  writeByte(0x02);
  writeString('Height');
  writeShort(schem.height);

  // Tag_Short: "Length"
  writeByte(0x02);
  writeString('Length');
  writeShort(schem.length);

  // Tag_Compound: "Palette"
  writeByte(0x0a);
  writeString('Palette');
  for (const [stateStr, id] of schem.palette.entries()) {
    writeByte(0x03); // Tag_Int
    writeString(stateStr);
    writeInt(id);
  }
  writeByte(0x00); // TAG_End for Palette

  // Tag_Int: "PaletteMax"
  writeByte(0x03);
  writeString('PaletteMax');
  writeInt(schem.palette.size);

  // Tag_Byte_Array: "BlockData"
  writeByte(0x07);
  writeString('BlockData');
  writeInt(schem.blockData.length);
  for (let i = 0; i < schem.blockData.length; i++) {
    buffer.push(schem.blockData[i]);
  }

  // Tag_Compound: "Metadata"
  writeByte(0x0a);
  writeString('Metadata');
  writeByte(0x08); // Tag_String
  writeString('Name');
  writeString(schem.metadata.name);
  writeByte(0x08);
  writeString('Author');
  writeString(schem.metadata.author);
  writeByte(0x00); // TAG_End for Metadata

  // TAG_End for Root Compound
  writeByte(0x00);

  return new Uint8Array(buffer);
}

/**
 * Exports to genuine Litematica .litematic format (GZipped NBT Compound conforming to Litematica v5 specification).
 */
export function exportToLitematica(build: MinecraftBuild): Uint8Array {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const b of build.blocks) {
    if (b.position.x < minX) minX = b.position.x;
    if (b.position.y < minY) minY = b.position.y;
    if (b.position.z < minZ) minZ = b.position.z;
    if (b.position.x > maxX) maxX = b.position.x;
    if (b.position.y > maxY) maxY = b.position.y;
    if (b.position.z > maxZ) maxZ = b.position.z;
  }

  const width = Math.max(1, maxX - minX + 1);
  const height = Math.max(1, maxY - minY + 1);
  const length = Math.max(1, maxZ - minZ + 1);
  const totalVolume = width * height * length;

  // Build unique BlockState Palette
  const paletteList: BlockPlacement[] = [{ id: 'air', blockId: 'minecraft:air', position: { x: 0, y: 0, z: 0 } }];
  const paletteMap = new Map<string, number>();
  paletteMap.set('minecraft:air', 0);

  const blockIndices = new Uint32Array(totalVolume);

  for (const b of build.blocks) {
    const x = b.position.x - minX;
    const y = b.position.y - minY;
    const z = b.position.z - minZ;

    if (x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < length) {
      const stateStr = formatBlockStateString(b);
      let palId = paletteMap.get(stateStr);
      if (palId === undefined) {
        palId = paletteList.length;
        paletteMap.set(stateStr, palId);
        paletteList.push(b);
      }
      // Litematica indexing: (y * length + z) * width + x
      const idx = (y * length + z) * width + x;
      blockIndices[idx] = palId;
    }
  }

  // Construct binary NBT buffer
  const buffer: number[] = [];
  const writeByte = (b: number) => buffer.push(b & 0xff);
  const writeShort = (s: number) => {
    buffer.push((s >> 8) & 0xff);
    buffer.push(s & 0xff);
  };
  const writeInt = (i: number) => {
    buffer.push((i >> 24) & 0xff);
    buffer.push((i >> 16) & 0xff);
    buffer.push((i >> 8) & 0xff);
    buffer.push(i & 0xff);
  };
  const writeLong = (high: number, low: number) => {
    writeInt(high);
    writeInt(low);
  };
  const writeString = (str: string) => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    writeShort(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer.push(bytes[i]);
  };

  // Root Compound: 0x0A, Name: ""
  writeByte(0x0a);
  writeString('');

  // Tag_Int: "MinecraftDataVersion"
  writeByte(0x03);
  writeString('MinecraftDataVersion');
  writeInt(build.version === '1.21' ? 3953 : 3465);

  // Tag_Int: "Version"
  writeByte(0x03);
  writeString('Version');
  writeInt(5);

  // Tag_Compound: "Metadata"
  writeByte(0x0a);
  writeString('Metadata');

  writeByte(0x08); // Tag_String
  writeString('Author');
  writeString('VoxelForge AI Engine');

  writeByte(0x08); // Tag_String
  writeString('Name');
  writeString(build.name);

  writeByte(0x03); // Tag_Int
  writeString('RegionCount');
  writeInt(1);

  writeByte(0x03); // Tag_Int
  writeString('TotalBlocks');
  writeInt(build.blocks.length);

  writeByte(0x03); // Tag_Int
  writeString('TotalVolume');
  writeInt(totalVolume);

  // EnclosingSize Compound
  writeByte(0x0a);
  writeString('EnclosingSize');
  writeByte(0x03); writeString('x'); writeInt(width);
  writeByte(0x03); writeString('y'); writeInt(height);
  writeByte(0x03); writeString('z'); writeInt(length);
  writeByte(0x00); // TAG_End for EnclosingSize

  writeByte(0x00); // TAG_End for Metadata

  // Tag_Compound: "Regions"
  writeByte(0x0a);
  writeString('Regions');

  // Region Compound "Main"
  writeByte(0x0a);
  writeString('Main');

  // Position
  writeByte(0x0a);
  writeString('Position');
  writeByte(0x03); writeString('x'); writeInt(0);
  writeByte(0x03); writeString('y'); writeInt(0);
  writeByte(0x03); writeString('z'); writeInt(0);
  writeByte(0x00);

  // Size
  writeByte(0x0a);
  writeString('Size');
  writeByte(0x03); writeString('x'); writeInt(width);
  writeByte(0x03); writeString('y'); writeInt(height);
  writeByte(0x03); writeString('z'); writeInt(length);
  writeByte(0x00);

  // BlockStatePalette Tag_List (0x09) of Tag_Compound (0x0A)
  writeByte(0x09);
  writeString('BlockStatePalette');
  writeByte(0x0a); // List element type: Tag_Compound
  writeInt(paletteList.length);

  for (const palItem of paletteList) {
    writeByte(0x08); // Tag_String "Name"
    writeString('Name');
    writeString(palItem.blockId);

    if (palItem.state && Object.keys(palItem.state).length > 0) {
      writeByte(0x0a); // Tag_Compound "Properties"
      writeString('Properties');
      for (const [k, v] of Object.entries(palItem.state)) {
        writeByte(0x08); // Tag_String
        writeString(k);
        writeString(v);
      }
      writeByte(0x00); // TAG_End for Properties
    }
    writeByte(0x00); // TAG_End for palette element
  }

  // BlockStates: Tag_Long_Array (0x0C)
  // Bits per block: min 2, ceil(log2(paletteList.length))
  const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(Math.max(2, paletteList.length))));
  const blocksPerLong = Math.floor(64 / bitsPerBlock);
  const numLongs = Math.ceil(totalVolume / blocksPerLong);

  writeByte(0x0c); // Tag_Long_Array
  writeString('BlockStates');
  writeInt(numLongs);

  for (let l = 0; l < numLongs; l++) {
    let low = 0;
    let high = 0;
    const startIdx = l * blocksPerLong;
    for (let b = 0; b < blocksPerLong; b++) {
      const idx = startIdx + b;
      if (idx < totalVolume) {
        const val = blockIndices[idx];
        const bitOffset = b * bitsPerBlock;
        if (bitOffset < 32) {
          low |= (val << bitOffset);
          if (bitOffset + bitsPerBlock > 32) {
            high |= (val >>> (32 - bitOffset));
          }
        } else {
          high |= (val << (bitOffset - 32));
        }
      }
    }
    writeLong(high, low);
  }

  writeByte(0x00); // TAG_End for "Main" Region
  writeByte(0x00); // TAG_End for "Regions"
  writeByte(0x00); // TAG_End for Root

  return gzip(new Uint8Array(buffer));
}

/**
 * Exports complete build data as clean formatted JSON.
 */
export function exportToBuildJSON(build: MinecraftBuild): string {
  const bom = calculateMaterialBOM(build);
  const data = {
    app: 'VoxelForge AI Minecraft Engine',
    name: build.name,
    version: build.version,
    dimensions: build.dimensions,
    metadata: build.metadata,
    billOfMaterials: bom,
    blocks: build.blocks.map((b) => ({
      block: b.blockId,
      pos: [b.position.x, b.position.y, b.position.z],
      state: b.state || null,
    })),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Triggers a file download in the user's browser.
 */
export function downloadFile(content: Uint8Array | string, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : new Blob([content as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
