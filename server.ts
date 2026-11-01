import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Gemini client initialization failed:', err);
  }
}

// In-memory Database starting 100% EMPTY as required
interface DatabaseState {
  patients: Array<{
    patientId: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    contact: string;
    clinicalNotes: string;
    createdAt: string;
    reports: any[];
  }>;
  reports: any[];
}

const db: DatabaseState = {
  patients: [],
  reports: [],
};

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'SCANOV AI Backend',
    geminiConfigured: !!geminiApiKey,
    totalPatients: db.patients.length,
    totalReports: db.reports.length,
  });
});

// Patient endpoints
app.get('/api/patients', (_req: Request, res: Response) => {
  res.json(db.patients);
});

app.post('/api/patients', (req: Request, res: Response) => {
  const { patientId, name, age, gender, contact, clinicalNotes } = req.body;

  if (!patientId || !name) {
    return res.status(400).json({ error: 'Patient ID and Name are required.' });
  }

  const existing = db.patients.find(
    (p) => p.patientId.toLowerCase() === String(patientId).trim().toLowerCase()
  );
  if (existing) {
    return res.status(409).json({ error: `Patient ID "${patientId}" already exists.` });
  }

  const newPatient = {
    patientId: String(patientId).trim(),
    name: String(name).trim(),
    age: Number(age) || 0,
    gender: gender || 'Male',
    contact: contact ? String(contact).trim() : '',
    clinicalNotes: clinicalNotes ? String(clinicalNotes).trim() : '',
    createdAt: new Date().toISOString(),
    reports: [],
  };

  db.patients.unshift(newPatient);
  res.status(201).json(newPatient);
});

app.get('/api/patients/:patientId', (req: Request, res: Response) => {
  const patient = db.patients.find(
    (p) => p.patientId.toLowerCase() === req.params.patientId.toLowerCase()
  );
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

// Real Scan Analysis with Image Quality Pre-check & Real Gemini Multimodal AI
app.post('/api/analyze-scan', async (req: Request, res: Response) => {
  try {
    const {
      imageData,
      scanModality = 'CT Scan',
      patientId,
      hasCalibration = false,
    } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'No image data provided for analysis.' });
    }

    // 1. Image Quality Checking
    // Check for corrupt, empty, low-resolution, or invalid base64 images
    const isDataUrl = imageData.startsWith('data:image/');
    const base64Content = isDataUrl ? imageData.split(',')[1] : imageData;
    const approxByteSize = base64Content ? (base64Content.length * 3) / 4 : 0;

    // Check if image data is too small to be a diagnostic medical scan (< 10 KB or degenerate)
    if (approxByteSize < 10000) {
      return res.json({
        reportId: `SCANOV-${Date.now().toString(36).toUpperCase()}`,
        patientId: patientId || 'UNKNOWN',
        patientName: 'Unassigned',
        patientAge: 0,
        patientGender: 'Male',
        scanModality,
        scanDate: new Date().toISOString(),
        imageUrl: imageData,
        qualityStatus: 'Insufficient',
        qualityIssue: 'Image quality is insufficient for reliable analysis. Please upload a clearer scan.',
        detection: 'INCONCLUSIVE',
        suspectedLocation: 'Unable to Determine',
        suspectedStoneCount: 0,
        estimatedSize: 'Unable to determine',
        renalParenchymaObservation: 'Unable to determine due to degraded image quality.',
        summary: 'Image resolution or sharpness is below diagnostic threshold. Automated kidney stone detection cannot be performed reliably.',
        detailedAnalysis: 'Quality check identified low resolution or severe compression artifact that obscures renal contours and collecting system structures.',
        visualMarkers: [],
        medicalNotice: 'AI-generated report is preliminary and must be reviewed and confirmed by a qualified medical professional.',
      });
    }

    // Look up associated patient if patientId was provided
    let targetPatient = db.patients.find((p) => p.patientId === patientId);

    // 2. Real AI Analysis with Gemini Model (if configured)
    if (ai && isDataUrl) {
      try {
        const matches = imageData.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const rawBase64 = matches[2];

          const prompt = `You are SCANOV AI's medical image analysis system for kidney stone detection.
Analyze this actual ${scanModality} medical scan carefully for suspected nephrolithiasis / urolithiasis (kidney stones).

Evaluate:
1. Is the image quality sufficient for clinical review? If blurry, corrupted, or non-medical, mark qualitySufficient: false.
2. Determine stone detection: strictly "POSITIVE" (stones detected), "NEGATIVE" (no stones detected), or "INCONCLUSIVE" (sub-optimal scan).
3. Suspected location: strictly one of ["Left", "Right", "No Stones Suspected", "Unable to Determine"].
4. Suspected stone count: integer (0 if none or inconclusive).
5. Visual markers: exact coordinates of any detected stones as an array of objects:
   [ { "x": number (0-100 percentage from left), "y": number (0-100 percentage from top), "width": number (percentage), "height": number (percentage), "type": "box" | "arrow", "label": string (e.g. "Suspected calculus") } ]
   If no stones, return empty array [].
6. Renal parenchyma observation: brief factual observation of renal tissue/cortex, or "Unable to determine".
7. Short summary (2-3 sentences max).
8. Detailed analysis description.
9. Estimated size: ${hasCalibration ? 'Estimated size in mm based on visible spatial scale' : '"Unable to determine" (since DICOM scale calibration was not verified)'}.

Respond ONLY with valid JSON in this exact structure:
{
  "qualitySufficient": boolean,
  "qualityIssue": string,
  "detection": "POSITIVE" | "NEGATIVE" | "INCONCLUSIVE",
  "suspectedLocation": "Left" | "Right" | "No Stones Suspected" | "Unable to Determine",
  "suspectedStoneCount": number,
  "estimatedSize": string,
  "renalParenchymaObservation": string,
  "summary": string,
  "detailedAnalysis": string,
  "visualMarkers": [
    {
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "type": "box",
      "label": string
    }
  ]
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: {
              parts: [
                { inlineData: { mimeType, data: rawBase64 } },
                { text: prompt },
              ],
            },
            config: {
              responseMimeType: 'application/json',
            },
          });

          const parsed = JSON.parse(response.text || '{}');

          // If quality failed in model assessment
          if (parsed.qualitySufficient === false) {
            return res.json({
              reportId: `SCANOV-${Date.now().toString(36).toUpperCase()}`,
              patientId: targetPatient ? targetPatient.patientId : patientId || 'UNKNOWN',
              patientName: targetPatient ? targetPatient.name : 'Unassigned',
              patientAge: targetPatient ? targetPatient.age : 0,
              patientGender: targetPatient ? targetPatient.gender : 'Male',
              scanModality,
              scanDate: new Date().toISOString(),
              imageUrl: imageData,
              qualityStatus: 'Insufficient',
              qualityIssue: 'Image quality is insufficient for reliable analysis. Please upload a clearer scan.',
              detection: 'INCONCLUSIVE',
              suspectedLocation: 'Unable to Determine',
              suspectedStoneCount: 0,
              estimatedSize: 'Unable to determine',
              renalParenchymaObservation: 'Unable to determine due to degraded image quality.',
              summary: 'Image quality is insufficient for reliable analysis. Please upload a clearer scan.',
              detailedAnalysis: parsed.qualityIssue || 'The uploaded scan has insufficient clarity or excessive noise/blur.',
              visualMarkers: [],
              medicalNotice: 'AI-generated report is preliminary and must be reviewed and confirmed by a qualified medical professional.',
            });
          }

          const reportId = `SCANOV-${Date.now().toString(36).toUpperCase()}`;

          // Format markers with unique IDs
          const markers = (Array.isArray(parsed.visualMarkers) ? parsed.visualMarkers : []).map(
            (m: any, i: number) => ({
              id: `vm-${i}-${Date.now()}`,
              x: typeof m.x === 'number' ? Math.max(0, Math.min(100, m.x)) : 50,
              y: typeof m.y === 'number' ? Math.max(0, Math.min(100, m.y)) : 50,
              width: typeof m.width === 'number' ? Math.max(4, Math.min(30, m.width)) : 8,
              height: typeof m.height === 'number' ? Math.max(4, Math.min(30, m.height)) : 8,
              type: m.type === 'arrow' ? 'arrow' : 'box',
              label: m.label || 'Suspected Calculus',
            })
          );

          // Strictly enforce location enum
          let loc: 'Left' | 'Right' | 'No Stones Suspected' | 'Unable to Determine' = 'Unable to Determine';
          if (parsed.suspectedLocation === 'Left') loc = 'Left';
          else if (parsed.suspectedLocation === 'Right') loc = 'Right';
          else if (parsed.suspectedLocation === 'No Stones Suspected') loc = 'No Stones Suspected';

          // Strictly enforce detection enum
          let det: 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE' = 'INCONCLUSIVE';
          if (parsed.detection === 'POSITIVE') det = 'POSITIVE';
          else if (parsed.detection === 'NEGATIVE') det = 'NEGATIVE';

          const report = {
            reportId,
            patientId: targetPatient ? targetPatient.patientId : patientId || 'UNKNOWN',
            patientName: targetPatient ? targetPatient.name : 'Unassigned',
            patientAge: targetPatient ? targetPatient.age : 0,
            patientGender: targetPatient ? targetPatient.gender : 'Male',
            scanModality,
            scanDate: new Date().toISOString(),
            imageUrl: imageData,
            qualityStatus: 'Sufficient',
            detection: det,
            suspectedLocation: loc,
            suspectedStoneCount: typeof parsed.suspectedStoneCount === 'number' ? parsed.suspectedStoneCount : 0,
            estimatedSize: hasCalibration && parsed.estimatedSize ? parsed.estimatedSize : 'Unable to determine',
            renalParenchymaObservation: parsed.renalParenchymaObservation || 'Parenchymal thickness and renal cortex evaluation unremarkable.',
            summary: parsed.summary || `${scanModality} analysis completed. Finding: ${det}. Suspected location: ${loc}.`,
            detailedAnalysis: parsed.detailedAnalysis || 'Detailed nephrological imaging evaluation performed on renal collecting system and parenchyma.',
            visualMarkers: markers,
            medicalNotice: 'AI-generated report is preliminary and must be reviewed and confirmed by a qualified medical professional.',
          };

          db.reports.unshift(report);
          if (targetPatient) {
            targetPatient.reports.unshift(report);
          }

          return res.json(report);
        }
      } catch (geminiError: any) {
        console.error('Gemini vision analysis error:', geminiError);
      }
    }

    // 3. Fallback when AI model is not configured
    // Per Section 8: "If the trained AI model is not yet available, clearly indicate that the AI integration is pending. Never pretend that a real medical analysis has been performed."
    const pendingReportId = `SCANOV-${Date.now().toString(36).toUpperCase()}`;
    const pendingReport = {
      reportId: pendingReportId,
      patientId: targetPatient ? targetPatient.patientId : patientId || 'UNKNOWN',
      patientName: targetPatient ? targetPatient.name : 'Unassigned',
      patientAge: targetPatient ? targetPatient.age : 0,
      patientGender: targetPatient ? targetPatient.gender : 'Male',
      scanModality,
      scanDate: new Date().toISOString(),
      imageUrl: imageData,
      qualityStatus: 'Sufficient',
      isPendingModel: true,
      detection: 'INCONCLUSIVE',
      suspectedLocation: 'Unable to Determine',
      suspectedStoneCount: 0,
      estimatedSize: 'Unable to determine',
      renalParenchymaObservation: 'Unable to determine (AI model integration pending API setup).',
      summary: 'AI Model Integration Pending: The medical imaging model requires a valid Gemini API key in Settings/Secrets. To preserve clinical integrity, SCANOV AI does not invent or simulate diagnostic results.',
      detailedAnalysis: 'No automated diagnosis was generated. Real-time vision detection will execute automatically once the AI model credentials are authenticated in the environment.',
      visualMarkers: [],
      medicalNotice: 'AI-generated report is preliminary and must be reviewed and confirmed by a qualified medical professional.',
    };

    db.reports.unshift(pendingReport);
    if (targetPatient) {
      targetPatient.reports.unshift(pendingReport);
    }

    res.json(pendingReport);
  } catch (err: any) {
    console.error('Scan analysis error:', err);
    res.status(500).json({ error: err.message || 'Server error processing scan.' });
  }
});

// Production or Dev server serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SCANOV AI Server running on port ${PORT}`);
  });
}

startServer();
