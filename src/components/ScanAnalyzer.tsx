import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  UserPlus,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import {
  ScanModality,
  AnalysisReport,
  VisualMarker,
  PatientRecord,
} from '../types/scanov';

interface ScanAnalyzerProps {
  patients: PatientRecord[];
  initialPatientId?: string | null;
  onReportGenerated?: (report: AnalysisReport) => void;
  onNavigateToAddPatient: () => void;
  preloadedReport?: AnalysisReport | null;
}

export const ScanAnalyzer: React.FC<ScanAnalyzerProps> = ({
  patients,
  initialPatientId,
  onReportGenerated,
  onNavigateToAddPatient,
  preloadedReport,
}) => {
  // Input Method: upload vs camera
  const [inputMode, setInputMode] = useState<'upload' | 'camera'>('upload');

  // Scan Modality: Strictly CT Scan | Ultrasound | MRI (X-ray is completely removed)
  const [scanModality, setScanModality] = useState<ScanModality>('CT Scan');

  // Patient Selection
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || (patients.length > 0 ? patients[0].patientId : '')
  );

  // Calibration Toggle
  const [hasCalibration, setHasCalibration] = useState<boolean>(false);

  // Image Data & Preview (starts completely EMPTY as required)
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  // Camera capture states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Quality check states
  const [qualityError, setQualityError] = useState<string | null>(null);

  // Analysis execution states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Viewer controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Report State
  const [report, setReport] = useState<AnalysisReport | null>(preloadedReport || null);
  const [isReadMoreExpanded, setIsReadMoreExpanded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if preloadedReport changes
  useEffect(() => {
    if (preloadedReport) {
      setReport(preloadedReport);
      setImageData(preloadedReport.imageUrl);
      setScanModality(preloadedReport.scanModality);
      setSelectedPatientId(preloadedReport.patientId);
    }
  }, [preloadedReport]);

  // Sync initial patient if provided
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    } else if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].patientId);
    }
  }, [initialPatientId, patients]);

  // Client-side quick blur / size assessment
  const evaluateImageQualityClient = (fileOrUrl: string | File): Promise<{ sufficient: boolean; reason?: string }> => {
    return new Promise((resolve) => {
      if (typeof fileOrUrl !== 'string') {
        if (fileOrUrl.size < 15000) {
          resolve({
            sufficient: false,
            reason: 'Image quality is insufficient for reliable analysis. Please upload a clearer scan.',
          });
          return;
        }
      }
      resolve({ sufficient: true });
    });
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQualityError(null);
    setReport(null);
    setImageFileName(file.name);

    // Format validation
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/dicom'];
    const isSupported = validMimes.includes(file.type) || file.name.endsWith('.dcm');
    if (!isSupported) {
      setQualityError('Image quality is insufficient for reliable analysis. Please upload a clearer scan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImageData(dataUrl);

      // Verify basic image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 250 || img.height < 250) {
          setQualityError('Image quality is insufficient for reliable analysis. Please upload a clearer scan.');
        } else {
          setQualityError(null);
        }
      };
      img.onerror = () => {
        setQualityError('Image quality is insufficient for reliable analysis. Please upload a clearer scan.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Camera functions
  const startCamera = async () => {
    setCameraError(null);
    setQualityError(null);
    setInputMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access device camera. Please grant camera permission or use file upload.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setImageData(dataUrl);
      setImageFileName(`scan_capture_${Date.now()}.jpg`);
      setReport(null);
      setQualityError(null);
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Run AI Analysis
  const handleAnalyzeScan = async () => {
    if (!imageData || isAnalyzing) return;

    if (!selectedPatientId) {
      alert('Please select or register a patient record for this scan.');
      return;
    }

    setIsAnalyzing(true);
    setQualityError(null);

    try {
      const res = await fetch('/api/analyze-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          scanModality,
          patientId: selectedPatientId,
          hasCalibration,
        }),
      });

      const data: AnalysisReport = await res.json();

      if (data.qualityStatus === 'Insufficient') {
        setQualityError('Image quality is insufficient for reliable analysis. Please upload a clearer scan.');
        setReport(null);
      } else {
        setReport(data);
        if (onReportGenerated) {
          onReportGenerated(data);
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setQualityError('Unable to connect to analysis service. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset/retry
  const handleRetry = () => {
    setImageData(null);
    setImageFileName('');
    setReport(null);
    setQualityError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Viewer Pan/Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetViewer = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Configuration & Ingestion Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Ingestion, Modality, Patient */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* A. Input Method: Upload Scan or Capture Scan */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Input Method
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Upload Scan */}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setInputMode('upload');
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all ${
                  inputMode === 'upload' && !cameraActive
                    ? 'border-cyan-600 bg-cyan-50/60 dark:bg-cyan-950/40 text-slate-900 dark:text-white ring-2 ring-cyan-600/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-white">
                    Upload Scan
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    JPG, PNG, or DICOM
                  </span>
                </div>
              </button>

              {/* Option 2: Capture Scan */}
              <button
                type="button"
                onClick={startCamera}
                className={`p-4 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all ${
                  cameraActive
                    ? 'border-cyan-600 bg-cyan-50/60 dark:bg-cyan-950/40 text-slate-900 dark:text-white ring-2 ring-cyan-600/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-white">
                    Capture Scan
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Device camera
                  </span>
                </div>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.dcm,.dicom"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Camera Viewfinder */}
            {cameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-cyan-500/40">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border border-cyan-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded">
                    Position scan in center
                  </span>
                </div>
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900/80 text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-4 py-1.5 text-xs font-bold bg-cyan-500 text-slate-950 rounded-xl hover:bg-cyan-400 flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                {cameraError}
              </p>
            )}

            {/* Active image status with remove / re-upload */}
            {imageData && !cameraActive && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {imageFileName || 'Uploaded Medical Scan'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
                  >
                    Change
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button
                    onClick={handleRetry}
                    className="text-rose-600 dark:text-rose-400 font-medium hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* B. Scan Modality: Strictly CT Scan | Ultrasound | MRI */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Scan Modality
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['CT Scan', 'Ultrasound', 'MRI'] as ScanModality[]).map((mod) => {
                const isSelected = scanModality === mod;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => {
                      setScanModality(mod);
                      setReport(null);
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 ring-2 ring-cyan-600/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Patient Identification */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Patient Identification
              </h3>
              <button
                type="button"
                onClick={onNavigateToAddPatient}
                className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                + Add Patient
              </button>
            </div>

            {patients.length > 0 ? (
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  setReport(null);
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
              >
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.patientId} – {p.name} ({p.age}y / {p.gender})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <p>No registered patient records available in the database.</p>
                <button
                  type="button"
                  onClick={onNavigateToAddPatient}
                  className="font-bold underline text-amber-900 dark:text-amber-200"
                >
                  Register a patient record first →
                </button>
              </div>
            )}
          </div>

          {/* D. Image Quality Error & Retry Button */}
          {qualityError && (
            <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl space-y-3">
              <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  {qualityError}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="w-full py-2 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                Retry / Upload Another Image
              </button>
            </div>
          )}

          {/* F. Analyze Scan with AI Button */}
          <button
            onClick={handleAnalyzeScan}
            disabled={!imageData || isAnalyzing || !!qualityError || patients.length === 0}
            className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              !imageData || isAnalyzing || !!qualityError || patients.length === 0
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white shadow-cyan-600/20'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running AI Scan Analysis...</span>
              </>
            ) : (
              <span>Analyze Scan with AI</span>
            )}
          </button>

        </div>

        {/* Right Viewport: E. Diagnostic Scan Preview and Calibration */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            
            {/* Viewport Top Bar */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Diagnostic Scan Preview
              </span>

              {imageData && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[11px] w-8 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetViewer}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded ml-1"
                    title="Reset View"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Viewport Canvas (Empty until user uploads or captures) */}
            <div
              className={`relative flex items-center justify-center bg-black min-h-[380px] sm:min-h-[440px] overflow-hidden select-none ${
                zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {imageData ? (
                <div
                  className="relative max-w-full max-h-full transition-transform duration-75"
                  style={{
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                  }}
                >
                  <img
                    src={imageData}
                    alt="Uploaded Medical Scan"
                    className="max-h-[440px] w-auto object-contain mx-auto"
                    draggable={false}
                  />

                  {/* AI Visual Markers on Detected Stone Regions */}
                  {report?.visualMarkers?.map((marker) => (
                    <div
                      key={marker.id}
                      className="absolute border-2 border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-500/30"
                      style={{
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                        width: `${marker.width || 8}%`,
                        height: `${marker.height || 8}%`,
                      }}
                    >
                      {/* Corner anchors */}
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />

                      {/* Label badge */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950/90 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none">
                        {marker.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state when no scan is uploaded */
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">
                    No scan image selected
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Upload an image or use the camera above to display the scan preview.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 6. AI ANALYSIS REPORT (Rendered after successful analysis) */}
      {report && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden space-y-6">
          
          {/* Report Top Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                  REPORT ID: {report.reportId}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(report.scanDate).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Clinical AI Analysis Report
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Patient: {report.patientName} ({report.patientId}) · {report.patientAge}y · {report.patientGender} · {report.scanModality}
              </p>
            </div>

            {/* A. Print PDF Option */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>Print / Download PDF</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Primary Findings Row: C. Detection, D. Location, E. Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* C. Stone Detection: ONLY POSITIVE or NEGATIVE */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Stone Detection
                </span>
                <span
                  className={`text-lg font-extrabold mt-1 block ${
                    report.detection === 'POSITIVE'
                      ? 'text-rose-600 dark:text-rose-400'
                      : report.detection === 'NEGATIVE'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {report.detection}
                </span>
              </div>

              {/* D. Suspected Location: Strictly Left | Right | No Stones Suspected | Unable to Determine */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Suspected Location
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {report.suspectedLocation}
                </span>
              </div>

              {/* E. Suspected Stone Count */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Suspected Stone Count
                </span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
                  {report.suspectedStoneCount}
                </span>
              </div>

            </div>

            {/* G. Renal Parenchyma Tissue Observation */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Renal Parenchyma Tissue Observation
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {report.renalParenchymaObservation}
              </p>
            </div>

            {/* H. Report Information and Summary with "Read More" Toggle */}
            <div className="p-5 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Report Information</span>
                </h4>

                <button
                  onClick={() => setIsReadMoreExpanded(!isReadMoreExpanded)}
                  className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-200 inline-flex items-center gap-1"
                >
                  <span>{isReadMoreExpanded ? 'Show Less' : 'Read More'}</span>
                  {isReadMoreExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Short & Clear Summary (Visible Initially) */}
              <div className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed space-y-1">
                <p>
                  <strong>Summary:</strong> {report.summary}
                </p>
                <div className="pt-1 text-[11px] text-sky-800 dark:text-sky-300 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Finding: {report.detection}</span>
                  <span>·</span>
                  <span>Location: {report.suspectedLocation}</span>
                  <span>·</span>
                  <span>Suspected Count: {report.suspectedStoneCount}</span>
                </div>
              </div>

              {/* Expanded Detailed Analysis (Displayed ONLY when Read More is clicked) */}
              {isReadMoreExpanded && (
                <div className="pt-3 border-t border-sky-200/60 dark:border-sky-800/60 text-xs text-sky-950 dark:text-sky-100 space-y-2 animate-in fade-in">
                  <h5 className="font-bold text-[11px] uppercase tracking-wide text-sky-900 dark:text-sky-300">
                    Complete Analysis Details
                  </h5>
                  <p className="leading-relaxed">
                    {report.detailedAnalysis}
                  </p>
                  {report.estimatedSize && (
                    <p className="font-mono text-[11px] text-sky-800 dark:text-sky-300">
                      Estimated Size: {report.estimatedSize}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* I. Mandatory Medical Notice */}
            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {report.medicalNotice}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Hidden Clean Printable Report for Browser PDF Printing */}
      {report && (
        <div className="hidden print:block p-8 bg-white text-black space-y-6">
          <div className="border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold tracking-tight">SCANOV AI – Clinical Imaging Report</h1>
            <p className="text-xs text-gray-600">Kidney Stone Detection and Scan Analysis Protocol</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border p-4 text-xs">
            <div>
              <p><strong>Report ID:</strong> {report.reportId}</p>
              <p><strong>Patient ID:</strong> {report.patientId}</p>
              <p><strong>Patient Name:</strong> {report.patientName}</p>
              <p><strong>Age / Gender:</strong> {report.patientAge} / {report.patientGender}</p>
            </div>
            <div>
              <p><strong>Scan Modality:</strong> {report.scanModality}</p>
              <p><strong>Date:</strong> {new Date(report.scanDate).toLocaleString()}</p>
            </div>
          </div>

          <div className="border p-4 text-xs space-y-2">
            <h3 className="font-bold text-sm">Analysis Results</h3>
            <p><strong>Stone Detection:</strong> {report.detection}</p>
            <p><strong>Suspected Location:</strong> {report.suspectedLocation}</p>
            <p><strong>Suspected Count:</strong> {report.suspectedStoneCount}</p>
            <p><strong>Renal Parenchyma Observation:</strong> {report.renalParenchymaObservation}</p>
          </div>

          <div className="border p-4 text-xs space-y-1">
            <h3 className="font-bold">Report Summary</h3>
            <p>{report.summary}</p>
            <p className="mt-2">{report.detailedAnalysis}</p>
          </div>

          <div className="border-t pt-4 text-[10px] italic text-gray-700">
            {report.medicalNotice}
          </div>
        </div>
      )}

      {/* Hidden canvas for video snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

    </div>
  );
};
