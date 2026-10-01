import { CameraPerspectiveInfo, ReferenceImageItem, ProvenanceType } from '../../types/minecraft';

/**
 * Camera Perspective & Single-Image Facet Visibility Reasoning.
 * Recognizes that a single reference view cannot observe all sides of a 3D volume.
 * Formulates explicit observed vs. inferred facet boundaries.
 */
export class CameraPerspectiveAnalyzer {
  /**
   * Infer camera perspective and facet visibility from reference image data.
   */
  public static analyzePerspective(
    primaryImage: ReferenceImageItem | { name?: string; probableView?: string }
  ): CameraPerspectiveInfo {
    const nameLower = (primaryImage.name || '').toLowerCase();
    const declaredView = primaryImage.probableView;

    if (declaredView === 'isometric' || nameLower.includes('isometric') || nameLower.includes('iso')) {
      return {
        viewDirection: 'isometric',
        elevation: 'three_quarter_elevated',
        observedFacets: ['front_facade', 'side_left', 'roof_front', 'roof_top'],
        inferredFacets: ['back_wall', 'side_right', 'roof_rear', 'sub_foundation'],
        confidence: 0.91,
      };
    }

    if (
      declaredView === 'three_quarter' ||
      nameLower.includes('three_quarter') ||
      nameLower.includes('angle') ||
      nameLower.includes('perspective') ||
      nameLower.includes('corner')
    ) {
      const isRight = nameLower.includes('right');
      return {
        viewDirection: isRight ? 'three_quarter_front_right' : 'three_quarter_front_left',
        elevation: 'three_quarter_elevated',
        observedFacets: isRight
          ? ['front_facade', 'side_right', 'roof_front']
          : ['front_facade', 'side_left', 'roof_front'],
        inferredFacets: isRight
          ? ['back_wall', 'side_left', 'roof_rear']
          : ['back_wall', 'side_right', 'roof_rear'],
        confidence: 0.93,
      };
    }

    if (declaredView === 'top' || nameLower.includes('top') || nameLower.includes('aerial')) {
      return {
        viewDirection: 'aerial',
        elevation: 'aerial',
        observedFacets: ['roof_top', 'upper_canopy', 'perimeter_parapet'],
        inferredFacets: ['ground_floor', 'lower_facade', 'interior', 'foundation'],
        confidence: 0.88,
      };
    }

    // Default: Ground-level or slight elevated Front elevation
    return {
      viewDirection: 'front',
      elevation: 'ground',
      observedFacets: ['front_facade', 'entrance_portal', 'front_fenestration', 'roof_gable_front'],
      inferredFacets: ['back_wall', 'rear_fenestration', 'side_walls', 'roof_ridge_rear'],
      confidence: 0.95,
    };
  }

  /**
   * Determine provenance and confidence for a block coordinate relative to the camera perspective.
   */
  public static evaluateBlockProvenance(
    x: number,
    y: number,
    z: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number },
    perspective: CameraPerspectiveInfo,
    isInteriorBlock: boolean = false
  ): { provenance: ProvenanceType; confidence: number } {
    if (isInteriorBlock) {
      return { provenance: 'generated', confidence: 0.62 };
    }

    const midZ = (bounds.minZ + bounds.maxZ) / 2;
    const midX = (bounds.minX + bounds.maxX) / 2;

    switch (perspective.viewDirection) {
      case 'front':
        // Front face (positive Z or front facade threshold) is observed
        if (z >= midZ + (bounds.maxZ - midZ) * 0.4) {
          return { provenance: 'observed', confidence: 0.95 };
        }
        return { provenance: 'inferred', confidence: 0.74 };

      case 'three_quarter_front_left':
        if (z >= midZ || x <= midX) {
          return { provenance: 'observed', confidence: 0.92 };
        }
        return { provenance: 'inferred', confidence: 0.70 };

      case 'three_quarter_front_right':
        if (z >= midZ || x >= midX) {
          return { provenance: 'observed', confidence: 0.92 };
        }
        return { provenance: 'inferred', confidence: 0.70 };

      case 'aerial':
        if (y >= bounds.maxY - 2) {
          return { provenance: 'observed', confidence: 0.90 };
        }
        return { provenance: 'inferred', confidence: 0.68 };

      default:
        if (z >= midZ) {
          return { provenance: 'observed', confidence: 0.90 };
        }
        return { provenance: 'inferred', confidence: 0.72 };
    }
  }
}
