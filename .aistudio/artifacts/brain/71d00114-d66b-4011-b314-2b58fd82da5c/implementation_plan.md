# AI Minecraft 3D Reconstruction Engine

A full-stack architectural reconstruction system that transforms 2D photographs, concept art, and architectural references into structurally sound, orientation-aware 3D Minecraft builds using exclusively legitimate Minecraft blocks and block states.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core parameters and user preferences have been confirmed and incorporated into the design:

- **1:1 Discrete Scale Target**: The reconstruction defaults to realistic 1:1 scale ($\approx 1\text{ block} = 1\text{ meter}$) preserving real-world architectural proportions while maintaining Minecraft's discrete voxel grid. An interactive scale adjuster ($0.5\times$ to $2.0\times$) allows scaling the density before or after reconstruction.
- **Multi-Format Schematic Export**: Prioritizes standard **WorldEdit / Sponge `.schem`**, **Litematica `.litematic`**, structured **Build JSON**, and **2D Layer-by-Layer Blueprints** with per-layer slice views and material bill of materials (BOM).
- **Version-Aware Block Registry**: Configurable Minecraft version target (1.20+ / 1.21), strictly enforcing legitimate block IDs and discrete block states (`facing`, `half`, `shape`, `axis`, `type`) with zero hallucinated or custom blocks.
- **Architectural Reference Gallery & Upload**: Features a curated 6-preset gallery (Medieval Watchtower, Japanese Pagoda, Modern Glass Villa, Gothic Archway, Desert Sandstone Temple, Nordic Timber Cottage) alongside an image upload system (drag-and-drop, PNG/JPG/WEBP validation, preview, multi-view support).

---

### 1. Overview & Core Concept

The application implements a rigorous **10-stage reconstruction pipeline**:

```
[Reference Image(s)]
         │
         ▼
[1. Vision Analysis (Gemini 3.8 Flash)] ──► Extracts silhouette, perspective, bounding box, floors, walls, openings, materials, & confidence maps
         │
         ▼
[2. Neutral 3D Architectural Model] ────► Continuous geometry (bounding boxes, wall planes, sloped roofs, lintels, columns, openings)
         │
         ▼
[3. Voxel Grid Discretizer] ────────────► Continuous geometry quantized into 3D discrete voxel space with configurable wall thickness
         │
         ▼
[4. Block Selection & Mapping Engine] ──► Maps materials & shapes to Minecraft block candidates (stairs, slabs, panes, logs, planks, stone bricks)
         │
         ▼
[5. Discrete Block Orientation Solver] ─► Calculates discrete states: facing (north/south/east/west), half (top/bottom), shape (inner_left, etc.)
         │
         ▼
[6. Structural & Plausibility Checker] ──► Eliminates floating blocks, solves staircase corners, connects walls and roof gables
         │
         ▼
[7. Build Validator] ───────────────────► Rejects unknown IDs, duplicate positions, and invalid state combinations
         │
         ▼
[8. High-Performance Three.js Viewport] ─► Instanced chunked rendering with orbit controls, first-person walk mode, and layer slicing
         │
         ▼
[9. Interactive 3D Editor & AI Assistant]► Paint, delete, select, replace, add, undo/redo, and natural-language prompt edits
         │
         ▼
[10. Schematic Exporter] ───────────────► Downloads .schem, .litematic, build JSON, and layer-by-layer blueprints
```

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Creation & Ingestion**:
   - The user visits `/dashboard` or `/project/new`.
   - Selects a preset reference building or drops an image (JPG, PNG, WEBP).
   - Configures target Minecraft version (e.g., 1.21 Java) and initial scale (1:1 standard).
2. **Deterministic Processing Pipeline**:
   - The user watches a transparent step-by-step progress monitor (`Analyzing Silhouette & Depth` $\to$ `Generating Neutral 3D Geometry` $\to$ `Voxelizing Structure` $\to$ `Solving Stair & Slab Orientations` $\to$ `Validating Block Palettes`).
   - Confidence metrics are displayed per architectural region (front wall: 94%, roof: 91%, rear: 48%).
3. **Interactive 3D Workbench**:
   - Opens full-viewport Three.js canvas with dark-slate studio lighting, grid plane, and skybox.
   - User switches between **Orbit Camera**, **Orthographic Projections** (Front, Top, Side), and **First-Person Walk** mode.
   - Selects, paints, moves, rotates, or deletes blocks with snapping.
   - Sliders for Layer Slicing ($Y=0$ to $Y_{\max}$) to inspect interior floors and roof structures layer-by-layer.
4. **Natural-Language Prompt Editing**:
   - The user types commands like *"Replace all oak planks with spruce planks"*, *"Raise the roof by 2 blocks"*, or *"Add stone brick stairs along the gables"*.
   - A structured diff is applied deterministically to the internal representation.
5. **Schematic Export & Resource Bill**:
   - Material calculator shows exact block counts, stack totals ($64\text{ per stack}$ + remainder), and container chests needed.
   - Exports valid `.schem`, `.litematic`, raw coordinates JSON, and printable 2D layer maps.

#### B. Visual Identity & Theme
- **Theme**: Dark obsidian workbench (`bg-slate-950` / `bg-zinc-900`) inspired by professional CAD tools and voxel editors (Blockbench, Blender).
- **Typography**: Clean display sans (`Plus Jakarta Sans`) paired with tabular monospace (`JetBrains Mono` / `tabular-nums`) for 3D coordinates ($X, Y, Z$) and block statistics.
- **No AI Slop / Zero-Pill Rules**: Unboxed metadata with typographic separators (`·`), single-row 3-zone top bar, no code comment prefixes (`//`), no fake scores.

---

### 3. Key Product Decisions & Trade-Offs

- **Full-Stack Architecture (Express + Vite)**:
  - *Chosen*: Express backend running via `server.ts` with `vite.middlewares` mounted in development.
  - *Why*: Multimodal AI calls to Gemini 3.8 Flash use server-side `process.env.GEMINI_API_KEY` without exposing keys to the client. Schematic binary parsing and generation can happen efficiently on the server or client-side worker.
- **Instanced Three.js Rendering**:
  - *Chosen*: `THREE.InstancedMesh` grouped by block texture/material, dynamic matrix updates, and chunk bounding boxes.
  - *Why*: Supports rendering 15,000+ blocks at 60 FPS smoothly without creating thousands of independent DOM or Three.js nodes.
- **Separation of Continuous Geometry and Discrete Voxels**:
  - *Chosen*: Scene analysis produces bounding volumes and planes; a separate geometric voxelizer maps them onto integer coordinates $[x, y, z]$; an orientation solver assigns discrete Minecraft block states.
  - *Why*: Prevents AI hallucination of invalid block states and coordinates while maintaining architectural consistency.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Three.js)                  │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ 3D Viewport           │  │ Workbench Control Panels               │ │
│  │ - InstancedMesh Chunk │  │ - Tool Palette (Select/Paint/Erase)    │ │
│  │ - Orbit & First-Person│  │ - Layer Slicer (Y=0..Ymax)             │ │
│  │ - Raycast Snapping    │  │ - Material Calculator (BOM & Stacks)   │ │
│  │ - Slice Clipping      │  │ - AI Natural Language Assistant        │ │
│  └───────────────────────┘  └────────────────────────────────────────┘ │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON API Requests
┌────────────────────────────────────▼───────────────────────────────────┐
│                        BACKEND SERVER (server.ts)                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ /api/reconstruct                                                 │  │
│  │   1. Gemini 3.8 Flash Vision (Scene & Architectural Analysis)    │  │
│  │   2. Neutral Geometry Generator                                  │  │
│  │   3. Voxel Grid Discretizer & Block Mapper                       │  │
│  │   4. Orientation Solver (Stairs, Slabs, Panes, Logs, Walls)      │  │
│  │   5. Structural Optimization & Build Validator                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ /api/export-schematic                                            │  │
│  │   Generates .schem (Sponge format), .litematic, & JSON           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ /api/modify-build                                                │  │
│  │   Structured natural-language diff operations                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Structures

```typescript
interface BlockState {
  blockId: string; // e.g. "minecraft:stone_brick_stairs"
  properties: Record<string, string>; // { facing: "north", half: "bottom", shape: "straight" }
}

interface BlockPlacement {
  id: string;
  blockId: string;
  position: { x: number; y: number; z: number };
  state?: Record<string, string>;
}

interface MinecraftBuild {
  version: "1.20" | "1.21";
  dimensions: { width: number; height: number; depth: number };
  blocks: BlockPlacement[];
  metadata: {
    name: string;
    sourceImage?: string;
    confidence: {
      overall: number;
      regions: Record<string, number>;
    };
    generatedAt: string;
  };
}
```

---

### Implementation Phases

1. **Phase 1: Shell & Server Backend**: Setup `server.ts` with Express and Vite middleware, configure endpoints (`/api/reconstruct`, `/api/modify`, `/api/export`).
2. **Phase 2: Minecraft Block Registry**: Create standard Minecraft 1.20/1.21 registry with geometry models (full cube, stair shapes, slabs, panes, fences, doors, logs) and state definitions.
3. **Phase 3: High-Performance 3D Viewport**: Implement Three.js instanced rendering, orbit controls, first-person walkthrough, grid helper, lighting, raycasting, and layer slicing.
4. **Phase 4: AI Vision Analysis & Neutral 3D Architecture**: Server-side Gemini 3.8 Flash multimodal analysis returning structured architectural scene parameters.
5. **Phase 5: Voxelization & Orientation Solver**: Deterministic algorithms converting continuous architectural bounds into integer voxel grids, resolving stair connections and slab elevations.
6. **Phase 6: 3D Workbench & Editing Tools**: Brush painting, block deletion, eye-dropper, coordinate HUD, undo/redo history, and layer-by-layer 2D blueprint slice viewer.
7. **Phase 7: Material Calculator & Schematic Exporter**: Real-time stack counter, Sponge `.schem` binary builder, `.litematic` builder, and JSON/PNG export.
8. **Phase 8: Validation, Testing & Preset Gallery**: Curated presets for instant testing, validation engine checking block states and coordinates, and verification.
