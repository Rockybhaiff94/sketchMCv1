import { UniversalReconstructor } from '../src/lib/reconstruction/universalReconstructor.ts';
import { ReferenceImageItem, ReconstructionSettings } from '../src/types/minecraft.ts';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { images = [], settings, imageBase64, mimeType = 'image/jpeg' } = body;

    const refImageList: ReferenceImageItem[] = Array.isArray(images) ? [...images] : [];
    if (refImageList.length === 0 && imageBase64) {
      refImageList.push({
        id: `ref_${Date.now()}`,
        name: 'Uploaded Reference',
        dataUrl: imageBase64,
        mimeType,
        probableView: 'front',
        confidence: 0.95,
      });
    }

    if (refImageList.length === 0) {
      return res.status(400).json({ error: 'At least one reference image must be provided' });
    }

    const reconstructionSettings: ReconstructionSettings = settings || {
      minecraftVersion: '1.21',
      buildScale: 'medium',
    };

    const result = await UniversalReconstructor.reconstruct(refImageList, reconstructionSettings);

    return res.status(200).json({
      success: true,
      build: result.build,
      semanticSubject: result.semanticSubject,
      fidelityReport: result.fidelityReport,
      councilReports: result.councilReports,
      validation: result.validation,
    });
  } catch (err: any) {
    console.error('Vercel API reconstruction error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal reconstruction error',
    });
  }
}
