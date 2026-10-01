import {
  BlockPlacement,
  ProvenanceType,
  RoomSpecification,
  RoomType,
  StructureType,
} from '../../types/minecraft';

export interface InteriorGenerationContext {
  structureType: StructureType;
  exteriorBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  wallHeight: number;
  paletteTheme?: {
    primaryWood?: string;
    secondaryWood?: string;
    stoneAccent?: string;
    lightSource?: string;
    flooring?: string;
  };
  doorPosition?: { x: number; y: number; z: number };
  isArchitectural: boolean;
}

export interface InteriorGenerationResult {
  blocks: BlockPlacement[];
  rooms: RoomSpecification[];
  hasInterior: boolean;
}

/**
 * Structure-Aware Interior Space & Room Generator.
 * Implements real physical volume, functional zoning, walkable circulation,
 * and style-compatible decoration without spam or clutter.
 */
export class InteriorGenerator {
  private static blockCounter = 0;

  /**
   * Determine whether the reference subject logically contains an inhabitable interior space.
   */
  public static hasInteriorSpace(
    structureType: StructureType,
    subjectName: string = '',
    isArchitectural: boolean = true
  ): boolean {
    const nameLower = subjectName.toLowerCase();

    // Explicit solid sculpture / statue overrides
    if (
      structureType === 'statue' ||
      structureType === 'monument' ||
      structureType === 'decorative object' ||
      nameLower.includes('statue') ||
      nameLower.includes('sculpture') ||
      nameLower.includes('monument')
    ) {
      return false;
    }

    // Garden landscaping is outdoor open-air
    if (structureType === 'garden' || structureType === 'landscape structure' || nameLower.includes('garden_outdoor')) {
      return false;
    }

    // Animal-shaped subjects: only if explicitly an architectural building
    if (structureType === 'animal-shaped structure') {
      return isArchitectural || nameLower.includes('house') || nameLower.includes('building') || nameLower.includes('hotel');
    }
    if (nameLower.includes('animal') || nameLower.includes('bison') || nameLower.includes('appa')) {
      return nameLower.includes('house') || nameLower.includes('building') || nameLower.includes('hotel');
    }

    // Plant-shaped subjects: only if an inhabitable treehouse
    if (structureType === 'plant-shaped structure') {
      return isArchitectural || nameLower.includes('treehouse') || nameLower.includes('inhabitable');
    }
    if (structureType === 'bridge') {
      return nameLower.includes('inhabitable');
    }

    // Vehicles: only if large enough for cabin/cockpit (aircraft, ship, large truck)
    if (structureType === 'vehicle' || structureType === 'aircraft' || structureType === 'ship') {
      return true; // enclosed cockpit / cabin
    }

    // Standard architectural building types
    return [
      'house',
      'cabin',
      'mansion',
      'farm',
      'barn',
      'greenhouse',
      'shop',
      'workshop',
      'factory',
      'tower',
      'castle',
      'temple',
    ].includes(structureType) || isArchitectural;
  }

  /**
   * Pre-plan functional room specifications based on structure type and dimensions.
   */
  public static planRooms(
    structureType: StructureType,
    dimensions: { width: number; height: number; depth: number }
  ): RoomSpecification[] {
    if (!this.hasInteriorSpace(structureType, '', true)) {
      return [];
    }

    const minX = -Math.round(dimensions.width / 2) + 1;
    const maxX = Math.round(dimensions.width / 2) - 1;
    const minZ = -Math.round(dimensions.depth / 2) + 1;
    const maxZ = Math.round(dimensions.depth / 2) - 1;
    const wallHeight = Math.min(5, Math.round(dimensions.height * 0.45));

    switch (structureType) {
      case 'greenhouse':
        return [
          {
            id: 'room_greenhouse_main',
            name: 'Planting & Conservatory Hall',
            type: 'planting_bay',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
            provenance: 'generated',
            confidence: 0.68,
            features: ['Central Stone Aisle', 'Raised Farmland Beds', 'Hanging Lanterns', 'Botanical Planters'],
          },
        ];
      case 'barn':
      case 'farm':
        return [
          {
            id: 'room_barn_stalls',
            name: 'Livestock & Stable Bays',
            type: 'animal_stable',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
            provenance: 'generated',
            confidence: 0.67,
            features: ['Fenced Stalls', 'Hay Storage Bales', 'Water Cauldron Trough'],
          },
        ];
      case 'workshop':
      case 'factory':
        return [
          {
            id: 'room_workshop_main',
            name: 'Crafting & Metallurgy Workshop',
            type: 'workshop_forge',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
            provenance: 'generated',
            confidence: 0.68,
            features: ['Anvil & Smithing Table', 'Blast Furnace Forge', 'Stonecutter Workstation', 'Tool Crates'],
          },
        ];
      case 'temple':
        return [
          {
            id: 'room_temple_sanctuary',
            name: 'Sacred Sanctuary Nave',
            type: 'altar_chamber',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
            provenance: 'generated',
            confidence: 0.70,
            features: ['Central Offering Dais', 'Ceremonial Altar', 'Sanctuary Lanterns'],
          },
        ];
      case 'castle':
        return [
          {
            id: 'room_castle_great_hall',
            name: 'Castle Great Hall',
            type: 'great_hall',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
            provenance: 'generated',
            confidence: 0.69,
            features: ['Throne Dais', 'Banqueting Table', 'Banner Accents', 'Grand Lanterns'],
          },
        ];
      case 'aircraft':
      case 'ship':
      case 'vehicle':
        return [
          {
            id: 'room_vehicle_cockpit',
            name: 'Operating Cockpit & Navigation Cabin',
            type: 'cockpit',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
            provenance: 'generated',
            confidence: 0.70,
            features: ['Pilot/Operator Seat', 'Control Dashboard', 'Navigation Instrument'],
          },
        ];
      case 'house':
      case 'cabin':
      case 'mansion':
      default: {
        const midZ = Math.round((minZ + maxZ) / 2);
        return [
          {
            id: 'room_house_living',
            name: 'Living Room & Hearth',
            type: 'living_room',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: midZ, zMax: maxZ },
            provenance: 'generated',
            confidence: 0.68,
            features: ['Seating Lounge', 'Coffee Table', 'Crafting Corner', 'Foyer Lantern'],
          },
          {
            id: 'room_house_bedroom',
            name: 'Sleeping Quarters & Storage',
            type: 'bedroom',
            bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: midZ - 1 },
            provenance: 'generated',
            confidence: 0.66,
            features: ['Single Bed', 'Nightstand with Pot', 'Storage Trunk Chest'],
          },
        ];
      }
    }
  }

  /**
   * Generate logical room partitioning and authentic Minecraft interior layout.
   */
  public static generateInterior(ctx: InteriorGenerationContext): InteriorGenerationResult {
    const { structureType, exteriorBounds, wallHeight, isArchitectural } = ctx;

    if (!this.hasInteriorSpace(structureType, '', isArchitectural)) {
      return { blocks: [], rooms: [], hasInterior: false };
    }

    const minX = exteriorBounds.minX + 1;
    const maxX = exteriorBounds.maxX - 1;
    const minZ = exteriorBounds.minZ + 1;
    const maxZ = exteriorBounds.maxZ - 1;
    const width = maxX - minX + 1;
    const depth = maxZ - minZ + 1;

    // Minimum dimensions required for an enterable interior cavity
    if (width < 3 || depth < 3 || wallHeight < 3) {
      return { blocks: [], rooms: [], hasInterior: false };
    }

    const placedBlocks: BlockPlacement[] = [];
    const rooms: RoomSpecification[] = [];
    this.blockCounter = 0;

    const put = (
      blockId: string,
      x: number,
      y: number,
      z: number,
      state?: Record<string, string>,
      confidence: number = 0.65
    ) => {
      this.blockCounter++;
      placedBlocks.push({
        id: `interior_${this.blockCounter}_${x}_${y}_${z}`,
        blockId,
        position: { x, y, z },
        state,
        provenance: 'generated',
        confidence,
      });
    };

    // Palettes
    const wood = ctx.paletteTheme?.primaryWood || 'minecraft:oak_planks';
    const slabWood = wood.replace('_planks', '_slab');
    const stairsWood = wood.replace('_planks', '_stairs');
    const lantern = ctx.paletteTheme?.lightSource || 'minecraft:lantern';

    // -----------------------------------------------------------------------
    // STRUCTURE-SPECIFIC INTERIOR LAYOUTS
    // -----------------------------------------------------------------------

    switch (structureType) {
      // 1. GREENHOUSE / CONSERVATORY
      case 'greenhouse': {
        const room: RoomSpecification = {
          id: 'room_greenhouse_main',
          name: 'Planting & Conservatory Hall',
          type: 'planting_bay',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
          provenance: 'generated',
          confidence: 0.68,
          features: ['Central Stone Aisle', 'Raised Farmland Beds', 'Hanging Lanterns', 'Botanical Planters'],
        };
        rooms.push(room);

        // Central walkway along Z (x = 0 or center)
        const midX = Math.round((minX + maxX) / 2);
        for (let z = minZ; z <= maxZ; z++) {
          put('minecraft:stone_brick_slab', midX, 1, z, { type: 'bottom' }, 0.70);
        }

        // Left Planting Bay (minX to midX - 1)
        for (let x = minX; x < midX; x++) {
          for (let z = minZ; z <= maxZ; z++) {
            if (z % 2 === 0) {
              put('minecraft:mud_bricks', x, 1, z, undefined, 0.65);
              const plant = (x + z) % 3 === 0 ? 'minecraft:flowering_azalea' : 'minecraft:fern';
              put(plant, x, 2, z, undefined, 0.62);
            } else {
              put('minecraft:farmland', x, 1, z, { moisture: '7' }, 0.65);
              put('minecraft:carrots', x, 2, z, { age: '7' }, 0.60);
            }
          }
        }

        // Right Planting Bay (midX + 1 to maxX)
        for (let x = midX + 1; x <= maxX; x++) {
          for (let z = minZ; z <= maxZ; z++) {
            if (z % 3 === 0) {
              put('minecraft:composter', x, 1, z, { level: '4' }, 0.65);
            } else {
              put('minecraft:farmland', x, 1, z, { moisture: '7' }, 0.65);
              put('minecraft:wheat', x, 2, z, { age: '7' }, 0.60);
            }
          }
        }

        // Hanging lanterns along central aisle ceiling
        for (let z = minZ + 2; z <= maxZ - 2; z += 4) {
          put(lantern, midX, Math.min(wallHeight, 5), z, { hanging: 'true' }, 0.70);
        }
        break;
      }

      // 2. BARN / FARM
      case 'barn':
      case 'farm': {
        const stallRoom: RoomSpecification = {
          id: 'room_barn_stalls',
          name: 'Livestock & Stable Bays',
          type: 'animal_stable',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: Math.min(4, wallHeight), zMin: minZ, zMax: maxZ },
          provenance: 'generated',
          confidence: 0.67,
          features: ['Fenced Stalls', 'Hay Storage Bales', 'Water Cauldron Trough'],
        };
        rooms.push(stallRoom);

        const midX = Math.round((minX + maxX) / 2);
        // Central aisle
        for (let z = minZ; z <= maxZ; z++) {
          put('minecraft:spruce_planks', midX, 1, z, undefined, 0.70);
        }

        // Stalls on left (minX to midX - 1)
        for (let z = minZ; z <= maxZ; z += 3) {
          put('minecraft:oak_fence', minX + 1, 1, z, undefined, 0.65);
          put('minecraft:oak_fence_gate', midX - 1, 1, z, { facing: 'east', in_wall: 'false', open: 'false' }, 0.65);
          put('minecraft:cauldron', minX, 1, z + 1, undefined, 0.62);
        }

        // Hay bales & tool storage on right
        for (let z = minZ; z <= maxZ; z += 2) {
          put('minecraft:hay_block', maxX, 1, z, { axis: 'y' }, 0.68);
          put('minecraft:hay_block', maxX, 2, z, { axis: 'y' }, 0.65);
          put('minecraft:barrel', maxX - 1, 1, z, { facing: 'up', open: 'false' }, 0.64);
        }

        // Lanterns on fence posts
        put(lantern, midX - 1, 2, minZ + 1, { hanging: 'false' }, 0.70);
        put(lantern, midX + 1, 2, maxZ - 1, { hanging: 'false' }, 0.70);
        break;
      }

      // 3. WORKSHOP / FACTORY
      case 'workshop':
      case 'factory': {
        const shopRoom: RoomSpecification = {
          id: 'room_workshop_main',
          name: 'Crafting & Metallurgy Workshop',
          type: 'workshop_forge',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
          provenance: 'generated',
          confidence: 0.68,
          features: ['Anvil & Smithing Table', 'Blast Furnace Forge', 'Stonecutter Workstation', 'Tool Crates'],
        };
        rooms.push(shopRoom);

        // Forge corner
        put('minecraft:blast_furnace', minX, 1, minZ, { facing: 'south', lit: 'true' }, 0.70);
        put('minecraft:blast_furnace', minX + 1, 1, minZ, { facing: 'south', lit: 'true' }, 0.70);
        put('minecraft:anvil', minX, 1, minZ + 2, { facing: 'east' }, 0.68);
        put('minecraft:smithing_table', minX + 1, 1, minZ + 2, undefined, 0.66);

        // Work table & crates along opposite wall
        put('minecraft:crafting_table', maxX, 1, minZ, undefined, 0.70);
        put('minecraft:stonecutter', maxX, 1, minZ + 1, { facing: 'west' }, 0.66);
        put('minecraft:barrel', maxX, 1, maxZ, { facing: 'up' }, 0.65);
        put('minecraft:barrel', maxX, 2, maxZ, { facing: 'up' }, 0.62);

        // Center lighting
        put(lantern, Math.round((minX + maxX) / 2), Math.min(wallHeight, 4), Math.round((minZ + maxZ) / 2), { hanging: 'true' }, 0.70);
        break;
      }

      // 4. TEMPLE
      case 'temple': {
        const sanctuaryRoom: RoomSpecification = {
          id: 'room_temple_sanctuary',
          name: 'Sacred Sanctuary Nave',
          type: 'altar_chamber',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
          provenance: 'generated',
          confidence: 0.70,
          features: ['Central Offering Dais', 'Ceremonial Altar', 'Sanctuary Lanterns'],
        };
        rooms.push(sanctuaryRoom);

        const midX = Math.round((minX + maxX) / 2);
        // Elevated Altar at rear
        put('minecraft:smooth_quartz_stairs', midX - 1, 1, minZ + 1, { facing: 'north', half: 'bottom' }, 0.70);
        put('minecraft:smooth_quartz', midX, 1, minZ + 1, undefined, 0.72);
        put('minecraft:smooth_quartz_stairs', midX + 1, 1, minZ + 1, { facing: 'north', half: 'bottom' }, 0.70);
        put('minecraft:gold_block', midX, 2, minZ + 1, undefined, 0.65); // focal offering
        put(lantern, midX, 3, minZ + 1, { hanging: 'false' }, 0.75);

        // Flanking columns & lanterns
        put(lantern, minX + 1, 2, maxZ - 1, { hanging: 'false' }, 0.70);
        put(lantern, maxX - 1, 2, maxZ - 1, { hanging: 'false' }, 0.70);
        break;
      }

      // 5. CASTLE
      case 'castle': {
        const hallRoom: RoomSpecification = {
          id: 'room_castle_great_hall',
          name: 'Castle Great Hall',
          type: 'great_hall',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
          provenance: 'generated',
          confidence: 0.69,
          features: ['Throne Dais', 'Banqueting Table', 'Banner Accents', 'Grand Lanterns'],
        };
        rooms.push(hallRoom);

        const midX = Math.round((minX + maxX) / 2);
        // Throne at rear
        put(stairsWood, midX, 2, minZ + 1, { facing: 'south', half: 'bottom' }, 0.72);
        put('minecraft:red_carpet', midX, 1, minZ + 2, undefined, 0.65);
        put('minecraft:red_carpet', midX, 1, minZ + 3, undefined, 0.65);

        // Banquet table in center
        for (let z = minZ + 4; z <= maxZ - 3; z += 2) {
          put(slabWood, midX, 1, z, { type: 'top' }, 0.66);
          put(stairsWood, midX - 1, 1, z, { facing: 'east', half: 'bottom' }, 0.62);
          put(stairsWood, midX + 1, 1, z, { facing: 'west', half: 'bottom' }, 0.62);
        }

        put(lantern, minX + 1, 3, minZ + 2, { hanging: 'true' }, 0.70);
        put(lantern, maxX - 1, 3, minZ + 2, { hanging: 'true' }, 0.70);
        break;
      }

      // 6. VEHICLE / AIRCRAFT / SHIP COCKPIT / CABIN
      case 'aircraft':
      case 'ship':
      case 'vehicle': {
        const cockpitRoom: RoomSpecification = {
          id: 'room_vehicle_cockpit',
          name: 'Operating Cockpit & Navigation Cabin',
          type: 'cockpit',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: maxZ },
          provenance: 'generated',
          confidence: 0.70,
          features: ['Pilot/Operator Seat', 'Control Dashboard', 'Navigation Instrument'],
        };
        rooms.push(cockpitRoom);

        const midX = Math.round((minX + maxX) / 2);
        const midZ = Math.round((minZ + maxZ) / 2);
        // Operator seat
        put('minecraft:dark_oak_stairs', midX, 1, midZ, { facing: 'south', half: 'bottom' }, 0.75);
        // Dashboard / steering control
        put('minecraft:lever', midX, 2, midZ + 1, { face: 'floor', facing: 'south' }, 0.68);
        put('minecraft:stone_button', midX + 1, 2, midZ + 1, { face: 'floor', facing: 'south' }, 0.65);
        break;
      }

      // 7. HOUSE / CABIN / MANSION / DEFAULT RESIDENTIAL
      case 'house':
      case 'cabin':
      case 'mansion':
      default: {
        const midX = Math.round((minX + maxX) / 2);
        const midZ = Math.round((minZ + maxZ) / 2);

        // Zone A: Entrance & Living Area (Front Half: z >= midZ)
        const livingRoom: RoomSpecification = {
          id: 'room_house_living',
          name: 'Living Room & Hearth',
          type: 'living_room',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: midZ, zMax: maxZ },
          provenance: 'generated',
          confidence: 0.68,
          features: ['Seating Lounge', 'Coffee Table', 'Crafting Corner', 'Foyer Lantern'],
        };
        rooms.push(livingRoom);

        // Sofa / seating
        put(stairsWood, minX + 1, 1, maxZ - 1, { facing: 'east', half: 'bottom' }, 0.68);
        put(stairsWood, minX + 1, 1, maxZ - 2, { facing: 'east', half: 'bottom' }, 0.68);
        put(slabWood, minX + 2, 1, maxZ - 1, { type: 'bottom' }, 0.65); // table

        // Kitchenette / crafting corner on front-right
        put('minecraft:crafting_table', maxX - 1, 1, maxZ - 1, undefined, 0.72);
        put('minecraft:furnace', maxX - 1, 1, maxZ - 2, { facing: 'west' }, 0.70);

        // Zone B: Sleeping Bedroom / Storage (Rear Half: z < midZ)
        const bedRoom: RoomSpecification = {
          id: 'room_house_bedroom',
          name: 'Sleeping Quarters & Storage',
          type: 'bedroom',
          bounds: { xMin: minX, xMax: maxX, yMin: 1, yMax: wallHeight, zMin: minZ, zMax: midZ - 1 },
          provenance: 'generated',
          confidence: 0.66,
          features: ['Single Bed', 'Nightstand with Pot', 'Storage Trunk Chest'],
        };
        rooms.push(bedRoom);

        // Bed (head against rear wall)
        put('minecraft:red_bed', minX + 1, 1, minZ + 1, { facing: 'south', part: 'head' }, 0.75);
        put('minecraft:red_bed', minX + 1, 1, minZ + 2, { facing: 'south', part: 'foot' }, 0.75);
        // Nightstand
        put(slabWood, minX, 1, minZ + 1, { type: 'top' }, 0.65);
        put('minecraft:flower_pot', minX, 2, minZ + 1, undefined, 0.60);

        // Chest storage on rear-right
        put('minecraft:chest', maxX - 1, 1, minZ + 1, { facing: 'south', type: 'single' }, 0.70);
        put('minecraft:bookshelf', maxX - 1, 1, minZ + 2, undefined, 0.68);

        // Ambient ceiling/wall lighting
        put(lantern, midX, Math.min(wallHeight, 4), midZ, { hanging: 'true' }, 0.72);
        break;
      }
    }

    return {
      blocks: placedBlocks,
      rooms,
      hasInterior: true,
    };
  }
}
