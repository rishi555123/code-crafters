import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  UploadCloud, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye,
  Sliders,
  Layers,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';

export default function CameraInspectorModal({
  isOpen,
  onClose,
  selectedZone,
  onApplyCVResult
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [cameraMode, setCameraMode] = useState('optical'); // optical, thermal, edges

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadedImage(previewUrl);
    setAnalyzing(true);
    setCvResult(null);

    try {
      const result = await apiService.analyzeCVImage(file, selectedZone?.zone_id || 'SLOPE_A');
      setCvResult(result);
      if (onApplyCVResult) {
        onApplyCVResult(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunSampleInference = (severity) => {
    setAnalyzing(true);
    setTimeout(() => {
      const result = {
        zone_id: selectedZone?.zone_id || 'SLOPE_A',
        timestamp: new Date().toISOString(),
        crack_detected: severity !== 'NONE',
        crack_severity: severity,
        deformation_mm: severity === 'HIGH' ? 12.8 : severity === 'MEDIUM' ? 7.4 : severity === 'LOW' ? 3.1 : 0.8,
        crack_confidence: severity !== 'NONE' ? 0.94 : 0.02
      };
      setCvResult(result);
      setAnalyzing(false);
      if (onApplyCVResult) {
        onApplyCVResult(result);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 rounded-xl border border-cyan-800/60 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Computer Vision Crack & Deformation Inspector</span>
                <span className="text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                  OpenCV + YOLO
                </span>
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Target: {selectedZone?.zone_name || selectedZone?.zone_id || 'SLOPE_A'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
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
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Optical Slope Camera Feed
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px] font-mono">
                  <button 
                    onClick={() => setCameraMode('optical')} 
                    className={`px-2 py-0.5 rounded ${cameraMode === 'optical' ? 'bg-cyan-600 text-black font-bold' : 'text-slate-400'}`}>
                    RGB
                  </button>
                  <button 
                    onClick={() => setCameraMode('edges')} 
                    className={`px-2 py-0.5 rounded ${cameraMode === 'edges' ? 'bg-cyan-600 text-black font-bold' : 'text-slate-400'}`}>
                    Contours
                  </button>
                  <button 
                    onClick={() => setCameraMode('thermal')} 
                    className={`px-2 py-0.5 rounded ${cameraMode === 'thermal' ? 'bg-cyan-600 text-black font-bold' : 'text-slate-400'}`}>
                    Thermal
                  </button>
                </div>
              </div>

              {/* Simulated Camera Screen */}
              <div className="relative aspect-video rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center group">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded Slope" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full relative flex items-center justify-center ${
                    cameraMode === 'thermal' 
                      ? 'bg-gradient-to-tr from-indigo-950 via-purple-950 to-amber-950' 
                      : cameraMode === 'edges'
                      ? 'bg-slate-950'
                      : 'bg-slate-900'
                  }`}>
                    {/* Simulated rock texture & grid */}
                    <div className="absolute inset-0 radar-grid opacity-30"></div>

                    {/* Crack fracture SVG overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 250">
                      {cvResult?.crack_detected && (
                        <>
                          <path 
                            d="M 120 40 L 145 90 L 170 110 L 195 160 L 230 210 M 170 110 L 210 130 L 250 145" 
                            fill="none" 
                            stroke={cvResult.crack_severity === 'HIGH' ? '#ef4444' : '#f59e0b'} 
                            strokeWidth={cvResult.crack_severity === 'HIGH' ? '4' : '2.5'} 
                            strokeDasharray={cameraMode === 'edges' ? '2 2' : 'none'}
                            className="animate-pulse"
                          />
                          <rect 
                            x="110" y="30" width="160" height="190" 
                            fill="none" 
                            stroke={cvResult.crack_severity === 'HIGH' ? '#ef4444' : '#f59e0b'} 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4" 
                          />
                          <text x="115" y="25" fill="#f87171" fontSize="11" fontFamily="monospace" fontWeight="bold">
                            FRACTURE #01: {cvResult.crack_severity} (Def: {cvResult.deformation_mm}mm)
                          </text>
                        </>
                      )}
                    </svg>

                    {/* Camera crosshairs and HUD */}
                    <div className="absolute top-3 left-3 font-mono text-[10px] text-cyan-400 bg-slate-950/80 px-2 py-1 rounded border border-cyan-900/60">
                      CAM-04 // {selectedZone?.zone_id || 'SLOPE_A'} // 30 FPS
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-slate-950/80 px-2 py-1 rounded border border-emerald-900/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>LIVE</span>
                    </div>

                    {!uploadedImage && (
                      <div className="text-center p-4 z-10">
                        <Scan className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                        <span className="text-xs font-mono text-slate-400 block">AI Contour & Crack Detection Ready</span>
                      </div>
                    )}
                  </div>
                )}

                {analyzing && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-400 gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-mono font-bold tracking-wider">RUNNING YOLO & OPENCV INFERENCE...</span>
                  </div>
                )}
              </div>

              {/* Upload or Preset Controls */}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-all">
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  <span>Upload Slope Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {uploadedImage && (
                  <button
                    onClick={() => { setUploadedImage(null); setCvResult(null); }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs border border-slate-800"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Right: CV Inference Analytics */}
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Inference Telemetry Payload</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">POST /api/cv-results</span>
                </div>

                {cvResult ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Crack Detected:</span>
                      <strong className={cvResult.crack_detected ? 'text-red-400' : 'text-emerald-400'}>
                        {cvResult.crack_detected ? 'TRUE (POSITIVE)' : 'FALSE (NEGATIVE)'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Crack Severity:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        cvResult.crack_severity === 'HIGH' ? 'bg-red-950 text-red-300 border border-red-800' :
                        cvResult.crack_severity === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        cvResult.crack_severity === 'LOW' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {cvResult.crack_severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Estimated Deformation:</span>
                      <strong className="text-cyan-300 text-sm">{cvResult.deformation_mm} mm</strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">AI Confidence:</span>
                      <strong className="text-slate-200">{(cvResult.crack_confidence * 100).toFixed(1)}%</strong>
                    </div>

                    <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
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
              <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Test Sample CV Scenarios
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRunSampleInference('NONE')}
                    className="py-1.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 font-mono text-xs font-bold transition-all"
                  >
                    Clean Slope
                  </button>
                  <button
                    onClick={() => handleRunSampleInference('MEDIUM')}
                    className="py-1.5 px-2 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-mono text-xs font-bold transition-all"
                  >
                    Medium Crack
                  </button>
                  <button
                    onClick={() => handleRunSampleInference('HIGH')}
                    className="py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-mono text-xs font-bold transition-all"
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

