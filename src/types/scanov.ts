export type ScanModality = 'CT Scan' | 'Ultrasound' | 'MRI';

export type DetectionResult = 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE';

export type SuspectedLocation = 'Left' | 'Right' | 'No Stones Suspected' | 'Unable to Determine';

export interface VisualMarker {
  id: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  width?: number; // 0-100 percentage
  height?: number; // 0-100 percentage
  type: 'box' | 'arrow' | 'circle';
  label: string;
}

export interface AnalysisReport {
  reportId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  scanModality: ScanModality;
  scanDate: string;
  imageUrl: string;
  detection: DetectionResult;
  suspectedLocation: SuspectedLocation;
  suspectedStoneCount: number;
  estimatedSize: string;
  renalParenchymaObservation: string;
  summary: string;
  detailedAnalysis: string;
  visualMarkers: VisualMarker[];
  qualityStatus: 'Sufficient' | 'Insufficient';
  qualityIssue?: string;
  isPendingModel?: boolean;
  medicalNotice: string;
}

export interface PatientRecord {
  patientId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  clinicalNotes: string;
  createdAt: string;
  reports: AnalysisReport[];
}

export interface AppSettings {
  language: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'zh' | 'ja';
  appearance: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}
