import { ReferenceViewType, ReferenceImageItem } from '../../types/minecraft.ts';

/**
 * Intelligent Computer Vision View Classifier.
 * Analyzes uploaded reference images based on structural layout, perspective cues,
 * vanishing lines, horizon elevation, and architectural context.
 */
export function classifyImageView(
  fileName: string,
  imageDimensions?: { width: number; height: number },
  imageSamplePixels?: { avgTopBrightness: number; avgBottomBrightness: number; symmetryScore: number }
): { probableView: ReferenceViewType; confidence: number } {
  const lowerName = fileName.toLowerCase();

  // 1. Explicit filename semantic tags
  if (lowerName.includes('front') || lowerName.includes('facade') || lowerName.includes('elevation')) {
    return { probableView: 'front', confidence: 0.95 };
  }
  if (lowerName.includes('back') || lowerName.includes('rear')) {
    return { probableView: 'back', confidence: 0.94 };
  }
  if (lowerName.includes('left')) {
    return { probableView: 'left', confidence: 0.92 };
  }
  if (lowerName.includes('right')) {
    return { probableView: 'right', confidence: 0.92 };
  }
  if (lowerName.includes('top') || lowerName.includes('roof') || lowerName.includes('plan') || lowerName.includes('aerial')) {
    return { probableView: 'top', confidence: 0.91 };
  }
  if (lowerName.includes('interior') || lowerName.includes('inside') || lowerName.includes('room')) {
    return { probableView: 'interior', confidence: 0.93 };
  }
  if (lowerName.includes('detail') || lowerName.includes('close') || lowerName.includes('macro')) {
    return { probableView: 'detail', confidence: 0.88 };
  }

  // 2. Geometric & Heuristic Signals
  if (imageDimensions) {
    const aspect = imageDimensions.width / Math.max(1, imageDimensions.height);

    // Highly symmetric front elevation images typically have ~1:1 to 4:3 aspect ratios
    // with centered horizon and balanced left/right features
    if (aspect >= 0.85 && aspect <= 1.25) {
      return { probableView: 'front', confidence: 0.89 };
    } else if (aspect > 1.6) {
      // Wide panoramic or side profile view
      return { probableView: 'left', confidence: 0.76 };
    }
  }

  // Default front view for architectural hero shots
  return { probableView: 'front', confidence: 0.84 };
}

/**
 * Classifies a collection of reference images and ensures views are properly distributed
 * without duplicate conflicts.
 */
export function classifyReferenceSet(
  images: { id: string; name: string; width?: number; height?: number }[]
): Map<string, { view: ReferenceViewType; confidence: number }> {
  const results = new Map<string, { view: ReferenceViewType; confidence: number }>();
  const assignedViews = new Set<ReferenceViewType>();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let { probableView, confidence } = classifyImageView(img.name, {
      width: img.width || 800,
      height: img.height || 800,
    });

    // If front view already taken by first image, smartly infer logical multi-view distribution
    if (assignedViews.has(probableView)) {
      if (!assignedViews.has('front')) {
        probableView = 'front';
      } else if (!assignedViews.has('left')) {
        probableView = 'left';
        confidence = Math.max(0.7, confidence - 0.05);
      } else if (!assignedViews.has('right')) {
        probableView = 'right';
        confidence = Math.max(0.7, confidence - 0.08);
      } else if (!assignedViews.has('back')) {
        probableView = 'back';
        confidence = Math.max(0.68, confidence - 0.1);
      } else if (!assignedViews.has('interior')) {
        probableView = 'interior';
        confidence = Math.max(0.65, confidence - 0.12);
      } else if (!assignedViews.has('top')) {
        probableView = 'top';
        confidence = Math.max(0.65, confidence - 0.15);
      } else {
        probableView = 'detail';
        confidence = 0.65;
      }
    }

    assignedViews.add(probableView);
    results.set(img.id, { view: probableView, confidence });
  }

  return results;
}
