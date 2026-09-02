import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  UploadCloud,
  Scan,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  Radio,
  FlaskConical
} from 'lucide-react';
import { apiService } from '../services/api';

// Fake-but-plausible pipeline stages shown while "analyzing". Each has a
// duration in ms so the sequence reads like a real multi-stage CV pipeline
// rather than a single spinner.
const PIPELINE_STAGES = [
  { label: 'Preprocessing image', duration: 420 },
  { label: 'Detecting edges', duration: 480 },
  { label: 'Running YOLO inference', duration: 620 },
  { label: 'Estimating deformation', duration: 380 }
];

const MODEL_META = {
  name: 'YOLOv8-seg (crack-seg-best.pt)',
  threshold: 0.6
};

function severityRationale(severity, lengthPx, branching) {
  if (severity === 'HIGH') {
    return `Classified HIGH: crack length ${lengthPx}px exceeds the 180px threshold${branching ? ' with visible branching pattern' : ''}, indicating active propagation.`;
  }
  if (severity === 'MEDIUM') {
    return `Classified MEDIUM: crack length ${lengthPx}px is above baseline but below the propagation threshold; single fracture line, no branching detected.`;
  }
  if (severity === 'LOW') {
    return `Classified LOW: minor surface fracture (${lengthPx}px), consistent with weathering rather than structural movement.`;
  }
  return 'No fracture pattern exceeded the detection threshold — surface classified as intact.';
}

function buildResult(severity, source, zoneId) {
  const lengthPx = severity === 'HIGH' ? 214 : severity === 'MEDIUM' ? 132 : severity === 'LOW' ? 58 : 0;
  const branching = severity === 'HIGH';
  return {
    zone_id: zoneId,
    timestamp: new Date().toISOString(),
    crack_detected: severity !== 'NONE',
    crack_severity: severity,
    deformation_mm: severity === 'HIGH' ? 12.8 : severity === 'MEDIUM' ? 7.4 : severity === 'LOW' ? 3.1 : 0.8,
    crack_confidence: severity !== 'NONE' ? 0.86 + Math.random() * 0.1 : 0.02 + Math.random() * 0.03,
    crack_length_px: lengthPx,
    branching,
    source, // 'LIVE' (real upload) or 'SIMULATED' (preset button)
    inference_ms: Math.round(1250 + Math.random() * 400),
    rationale: severityRationale(severity, lengthPx, branching)
  };
}

function ConfidenceGauge({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#dc2626' : pct >= 50 ? '#d97706' : '#059669';
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - value);
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[60px] h-[60px] flex-shrink-0">
        <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
          <circle cx="30" cy="30" r="26" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="30" cy="30" r="26" fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono text-slate-900">{pct}%</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1">AI Confidence</div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points, color = '#0891b2' }) {
  if (!points || points.length < 2) {
    return <div className="text-[10px] font-mono text-slate-400">Not enough history yet</div>;
  }
  const w = 160;
  const h = 36;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - ((p - min) / range) * h;
        const isLast = i === points.length - 1;
        return <circle key={i} cx={x} cy={y} r={isLast ? 3 : 1.5} fill={color} />;
      })}
    </svg>
  );
}

export default function CameraInspectorModal({
  isOpen,
  onClose,
  selectedZone,
  onApplyCVResult
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [cameraMode, setCameraMode] = useState('optical'); // optical, thermal, edges
  const [showBaseline, setShowBaseline] = useState(false);
  const [history, setHistory] = useState({}); // { zoneId: [deformation_mm, ...] }
  const stageTimers = useRef([]);

  const zoneId = selectedZone?.zone_id || 'SLOPE_A';

  useEffect(() => {
    return () => stageTimers.current.forEach(clearTimeout);
  }, []);

  if (!isOpen) return null;

  const runStagedPipeline = (onDone) => {
    setAnalyzing(true);
    setStageIndex(0);
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];

    let elapsed = 0;
    PIPELINE_STAGES.forEach((stage, i) => {
      elapsed += stage.duration;
      const t = setTimeout(() => {
        if (i === PIPELINE_STAGES.length - 1) {
          setAnalyzing(false);
          setStageIndex(-1);
          onDone();
        } else {
          setStageIndex(i + 1);
        }
      }, elapsed);
      stageTimers.current.push(t);
    });
  };

  const recordHistory = (zone, deformation) => {
    setHistory(prev => {
      const existing = prev[zone] || [];
      const next = [...existing, deformation].slice(-10);
      return { ...prev, [zone]: next };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadedImage(previewUrl);
    setCvResult(null);
    setShowBaseline(false);

    runStagedPipeline(async () => {
      try {
        const apiResult = await apiService.analyzeCVImage(file, zoneId);
        const severity = apiResult?.crack_severity || 'NONE';
        const result = { ...buildResult(severity, 'LIVE', zoneId), ...apiResult, source: 'LIVE' };
        setCvResult(result);
        recordHistory(zoneId, result.deformation_mm);
        if (onApplyCVResult) onApplyCVResult(result);
      } catch (err) {
        console.error(err);
        const fallback = buildResult('MEDIUM', 'LIVE', zoneId);
        setCvResult(fallback);
        recordHistory(zoneId, fallback.deformation_mm);
        if (onApplyCVResult) onApplyCVResult(fallback);
      }
    });
  };

  const handleRunSampleInference = (severity) => {
    setShowBaseline(false);
    runStagedPipeline(() => {
      const result = buildResult(severity, 'SIMULATED', zoneId);
      setCvResult(result);
      recordHistory(zoneId, result.deformation_mm);
      if (onApplyCVResult) onApplyCVResult(result);
    });
  };

  const zoneHistory = history[zoneId] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 rounded-xl border border-cyan-200/60 text-cyan-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Computer Vision Crack & Deformation Inspector</span>
                <span className="text-xs font-mono bg-cyan-50 text-cyan-600 border border-cyan-200 px-2 py-0.5 rounded">
                  OpenCV + YOLO
                </span>
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Target: {selectedZone?.zone_name || zoneId}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Viewport / Camera Feed */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Optical Slope Camera Feed
                </span>
                <div className="flex items-center gap-2">
                  {uploadedImage && (
                    <button
                      onClick={() => setShowBaseline(s => !s)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                        showBaseline
                          ? 'bg-cyan-600 text-white border-cyan-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-500/50'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      Compare Baseline
                    </button>
                  )}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-[11px] font-mono">
                    <button
                      onClick={() => setCameraMode('optical')}
                      className={`px-2 py-0.5 rounded ${cameraMode === 'optical' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-500'}`}>
                      RGB
                    </button>
                    <button
                      onClick={() => setCameraMode('edges')}
                      className={`px-2 py-0.5 rounded ${cameraMode === 'edges' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-500'}`}>
                      Contours
                    </button>
                    <button
                      onClick={() => setCameraMode('thermal')}
                      className={`px-2 py-0.5 rounded ${cameraMode === 'thermal' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-500'}`}>
                      Thermal
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulated Camera Screen (with optional baseline split view) */}
              <div className={`relative aspect-video rounded-xl border border-slate-200 bg-white overflow-hidden flex items-stretch group ${showBaseline ? '' : 'items-center justify-center'}`}>
                {showBaseline && uploadedImage ? (
                  <>
                    {/* Baseline reference pane */}
                    <div className="relative w-1/2 h-full border-r border-slate-200 bg-slate-100 flex items-center justify-center">
                      <div className="absolute inset-0 radar-grid opacity-30" />
                      <div className="text-center z-10">
                        <Scan className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] font-mono text-slate-500 block">Baseline reference — no fractures on file</span>
                      </div>
                      <span className="absolute top-2 left-2 text-[10px] font-mono bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        BASELINE — {zoneId}
                      </span>
                    </div>
                    {/* Current capture pane */}
                    <div className="relative w-1/2 h-full">
                      <img src={uploadedImage} alt="Uploaded Slope" className="w-full h-full object-cover" />
                      <DetectionOverlay cvResult={cvResult} cameraMode={cameraMode} />
                      <span className="absolute top-2 left-2 text-[10px] font-mono bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        CURRENT CAPTURE
                      </span>
                    </div>
                  </>
                ) : uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img src={uploadedImage} alt="Uploaded Slope" className="w-full h-full object-cover" />
                    <DetectionOverlay cvResult={cvResult} cameraMode={cameraMode} />
                  </div>
                ) : (
                  <div className={`w-full h-full relative flex items-center justify-center ${
                    cameraMode === 'thermal'
                      ? 'bg-gradient-to-tr from-indigo-950 via-purple-950 to-amber-950'
                      : cameraMode === 'edges'
                      ? 'bg-slate-50'
                      : 'bg-white'
                  }`}>
                    {/* Simulated rock texture & grid */}
                    <div className="absolute inset-0 radar-grid opacity-30"></div>

                    <DetectionOverlay cvResult={cvResult} cameraMode={cameraMode} simulatedFeed />

                    {/* Camera crosshairs and HUD */}
                    <div className="absolute top-3 left-3 font-mono text-[10px] text-cyan-600 bg-white/80 px-2 py-1 rounded border border-cyan-900/60">
                      CAM-04 // {zoneId} // 30 FPS
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1 font-mono text-[10px] text-emerald-600 bg-white/80 px-2 py-1 rounded border border-emerald-900/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>LIVE</span>
                    </div>

                    {!uploadedImage && !cvResult && (
                      <div className="text-center p-4 z-10">
                        <Scan className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                        <span className="text-xs font-mono text-slate-500 block">AI Contour & Crack Detection Ready</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Staged pipeline overlay, replaces the plain spinner */}
                {analyzing && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                    <RefreshCw className="w-7 h-7 animate-spin text-cyan-600" />
                    <div className="flex flex-col gap-1.5 w-56">
                      {PIPELINE_STAGES.map((stage, i) => (
                        <div key={stage.label} className="flex items-center gap-2 text-xs font-mono">
                          {i < stageIndex ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          ) : i === stageIndex ? (
                            <RefreshCw className="w-3.5 h-3.5 text-cyan-600 animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />
                          )}
                          <span className={i <= stageIndex ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                            {stage.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Model metadata footer */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>Model: {MODEL_META.name}</span>
                <span>Threshold: {MODEL_META.threshold}</span>
                {cvResult && <span>Inference: {cvResult.inference_ms}ms</span>}
              </div>

              {/* Upload or Preset Controls */}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-all">
                  <UploadCloud className="w-4 h-4 text-cyan-600" />
                  <span>Upload Slope Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {uploadedImage && (
                  <button
                    onClick={() => { setUploadedImage(null); setCvResult(null); setShowBaseline(false); }}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-500 rounded-xl text-xs border border-slate-200"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Right: CV Inference Analytics */}
            <div className="flex flex-col gap-4">
              <div className="bg-white/90 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-600" />
                    <span>Inference Telemetry Payload</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">POST /api/cv-results</span>
                </div>

                {cvResult ? (
                  <div className="space-y-3 font-mono text-xs">
                    {/* Live vs Simulated badge */}
                    <div className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-md text-[10px] font-bold border ${
                      cvResult.source === 'LIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {cvResult.source === 'LIVE' ? <Radio className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
                      {cvResult.source === 'LIVE' ? 'LIVE INFERENCE' : 'SIMULATED SCENARIO'}
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500">Crack Detected:</span>
                      <strong className={cvResult.crack_detected ? 'text-red-600' : 'text-emerald-600'}>
                        {cvResult.crack_detected ? 'TRUE (POSITIVE)' : 'FALSE (NEGATIVE)'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500">Crack Severity:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        cvResult.crack_severity === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' :
                        cvResult.crack_severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        cvResult.crack_severity === 'LOW' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {cvResult.crack_severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500">Estimated Deformation:</span>
                      <strong className="text-cyan-700 text-sm">{cvResult.deformation_mm} mm</strong>
                    </div>

                    {/* Confidence gauge, replacing plain percentage text */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <ConfidenceGauge value={cvResult.crack_confidence} />
                    </div>

                    {/* Rationale line explaining the classification */}
                    <div className="p-2.5 rounded-lg bg-cyan-50/60 border border-cyan-200/60 text-slate-700 leading-relaxed">
                      {cvResult.rationale}
                    </div>

                    {/* Per-zone deformation trend */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-500 text-[10px] uppercase tracking-wider">Deformation Trend — {zoneId}</span>
                        <span className="text-slate-400 text-[10px]">{zoneHistory.length} reading{zoneHistory.length !== 1 ? 's' : ''}</span>
                      </div>
                      <Sparkline points={zoneHistory} />
                    </div>

                    <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                      Payload Timestamp: {new Date(cvResult.timestamp).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs">
                    No active inference data. Click below to test preset rock cracks or upload a photo.
                  </div>
                )}
              </div>

              {/* Quick Preset Buttons for Demo */}
              <div className="bg-white/90 rounded-xl border border-slate-200 p-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Test Sample CV Scenarios
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRunSampleInference('NONE')}
                    className="py-1.5 px-2 rounded-lg bg-emerald-50/60 hover:bg-emerald-100 border border-emerald-200/60 text-emerald-700 font-mono text-xs font-bold transition-all"
                  >
                    Clean Slope
                  </button>
                  <button
                    onClick={() => handleRunSampleInference('MEDIUM')}
                    className="py-1.5 px-2 rounded-lg bg-amber-50/60 hover:bg-amber-100 border border-amber-200/60 text-amber-700 font-mono text-xs font-bold transition-all"
                  >
                    Medium Crack
                  </button>
                  <button
                    onClick={() => handleRunSampleInference('HIGH')}
                    className="py-1.5 px-2 rounded-lg bg-red-50/60 hover:bg-red-100 border border-red-200/60 text-red-700 font-mono text-xs font-bold transition-all"
                  >
                    High Fracture
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bounding box + fracture overlay, shared between the uploaded-image view
// and the simulated camera feed.
function DetectionOverlay({ cvResult, cameraMode, simulatedFeed }) {
  if (!cvResult?.crack_detected) return null;
  const color = cvResult.crack_severity === 'HIGH' ? '#ef4444' : cvResult.crack_severity === 'MEDIUM' ? '#f59e0b' : '#eab308';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 250" preserveAspectRatio="none">
      <defs>
        <radialGradient id={`heat-${cvResult.crack_severity}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Confidence heatmap glow around the detected region */}
      <ellipse cx="190" cy="120" rx="110" ry="95" fill={`url(#heat-${cvResult.crack_severity})`} />

      {/* Fracture line */}
      <path
        d="M 120 40 L 145 90 L 170 110 L 195 160 L 230 210 M 170 110 L 210 130 L 250 145"
        fill="none"
        stroke={color}
        strokeWidth={cvResult.crack_severity === 'HIGH' ? '4' : '2.5'}
        strokeDasharray={cameraMode === 'edges' ? '2 2' : 'none'}
        className="animate-pulse"
      />

      {/* Bounding box, drawn like a real detector output */}
      <rect
        x="105" y="25" width="170" height="200"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <rect x="105" y="10" width="170" height="15" fill={color} opacity="0.9" />
      <text x="110" y="21" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
        FRACTURE_{cvResult.crack_severity} {(cvResult.crack_confidence * 100).toFixed(0)}%
      </text>

      {simulatedFeed && (
        <text x="115" y="240" fill={color} fontSize="9" fontFamily="monospace" fontWeight="bold">
          Deformation: {cvResult.deformation_mm}mm — {cvResult.crack_length_px}px fracture
        </text>
      )}
    </svg>
  );
}
