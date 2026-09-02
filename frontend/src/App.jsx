import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import AlertBanner from './components/AlertBanner';
import CameraInspectorModal from './components/CameraInspectorModal';
import DemoController from './components/DemoController';

import DashboardPage from './pages/DashboardPage';
import ZoneDetailsPage from './pages/ZoneDetailsPage';
import IncidentsListPage from './pages/IncidentsListPage';
import IncidentDetailsPage from './pages/IncidentDetailsPage';

import { apiService } from './services/api';
import { DEFAULT_ZONES } from './constants/zones';
import { soundService } from './services/audio';

function AppContent() {
  const [zones, setZones] = useState(DEFAULT_ZONES.map(z => ({
    zone_id: z.id,
    zone_name: z.name,
    latitude: z.latitude,
    longitude: z.longitude,
    polygon: z.polygon,
    rock_type: z.rock_type,
    slope_angle: z.slope_angle,
    elevation_m: z.elevation_m,
    ...z.initialState
  })));

  const [selectedZoneId, setSelectedZoneId] = useState('SLOPE_A');
  const [isMockMode, setIsMockMode] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});

  // Modals & Drawers
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [currentScenarioId, setCurrentScenarioId] = useState(1);
  const [incidents, setIncidents] = useState([]);

  // Close any open modal/drawer whenever the route changes, so they never
  // stay mounted on top of a page the user has navigated away from.
  const location = useLocation();
  useEffect(() => {
    setIsCVModalOpen(false);
    setIsDemoDrawerOpen(false);
  }, [location.pathname]);

  // Fetch telemetry
  const fetchTelemetry = useCallback(async () => {
    try {
      const riskData = await apiService.getCurrentRisk();
      if (riskData && Array.isArray(riskData)) {
        setZones(prevZones => {
          return prevZones.map(pz => {
            const updated = riskData.find(d => (d.zone_id || d.id) === (pz.zone_id || pz.id));
            if (updated) {
              return { ...pz, ...updated };
            }
            return pz;
          });
        });
        setBackendConnected(!apiService.isMockMode());
      }
    } catch (err) {
      setBackendConnected(false);
    }
  }, []);

  // Fetch incidents
  const fetchIncidents = useCallback(async () => {
    try {
      const incList = await apiService.getIncidents();
      setIncidents(incList);
    } catch (err) {
      console.warn('Could not fetch incidents', err);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    fetchIncidents();

    const interval = setInterval(() => {
      fetchTelemetry();
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchTelemetry, fetchIncidents]);

  // Active high risk alerts
  const activeAlertZones = zones.filter(z => 
    z.risk_level === 'HIGH' && 
    z.alert_sent && 
    !z.stale && 
    !acknowledgedAlerts[z.zone_id || z.id]
  );

  const handleSelectZone = (zoneId) => {
    setSelectedZoneId(zoneId);
    soundService.playBeep(700, 0.05);
  };

  const handleAcknowledgeAlert = (zoneId) => {
    setAcknowledgedAlerts(prev => ({ ...prev, [zoneId]: true }));
    soundService.stopAlarm();
    soundService.playSuccess();
  };

  const handleToggleMockMode = () => {
    const nextMock = !isMockMode;
    setIsMockMode(nextMock);
    apiService.setMockMode(nextMock);
    soundService.playBeep(nextMock ? 440 : 880, 0.08);
    fetchTelemetry();
  };

  const handleTriggerScenario = (scenarioId) => {
    setCurrentScenarioId(scenarioId);
    const result = apiService.applyDemoScenario(scenarioId, selectedZoneId);
    
    setAcknowledgedAlerts(prev => ({ ...prev, [selectedZoneId]: false }));

    if (result && result.hysteresisFired) {
      soundService.startContinuousAlarm();
    } else if (scenarioId === 1) {
      soundService.playSuccess();
    } else {
      soundService.playBeep(600, 0.1);
    }

    fetchTelemetry();
    fetchIncidents();
  };

  const handleToggleStale = (zoneId) => {
    apiService.toggleStale(zoneId);
    fetchTelemetry();
    soundService.playBeep(350, 0.15, 'sawtooth');
  };

  const handleApplyCVResult = (cvResult) => {
    setZones(prev => prev.map(z => {
      if ((z.zone_id || z.id) === (cvResult.zone_id || selectedZoneId)) {
        return {
          ...z,
          crack_detected: cvResult.crack_detected,
          crack_severity: cvResult.crack_severity,
          deformation_mm: cvResult.deformation_mm,
          risk_level: cvResult.crack_severity === 'HIGH' ? 'HIGH' : cvResult.crack_severity === 'MEDIUM' ? 'MEDIUM' : z.risk_level,
          risk_score: cvResult.crack_severity === 'HIGH' ? 0.89 : cvResult.crack_severity === 'MEDIUM' ? 0.61 : z.risk_score
        };
      }
      return z;
    }));
  };

  const currentSelectedZone = zones.find(z => (z.zone_id || z.id) === selectedZoneId) || zones[0];

  return (
    <div className="min-h-screen bg-slate-50 text-white flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <Header
        activeAlertsCount={activeAlertZones.length}
        isMockMode={isMockMode}
        onToggleMockMode={handleToggleMockMode}
        onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)}
        onOpenCVModal={() => setIsCVModalOpen(true)}
        selectedZone={currentSelectedZone}
        backendConnected={backendConnected}
      />

      {/* Emergency Alert Banner */}
      <AlertBanner
        alertZones={activeAlertZones}
        onSelectZone={handleSelectZone}
        onAcknowledge={handleAcknowledgeAlert}
      />

      {/* Page Routing Views */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1720px] w-full mx-auto">
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardPage
                zones={zones}
                selectedZoneId={selectedZoneId}
                onSelectZone={handleSelectZone}
                onToggleStale={handleToggleStale}
                onOpenCVModal={() => setIsCVModalOpen(true)}
                incidents={incidents}
                onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)}
              />
            } 
          />

          <Route 
            path="/zone/:zoneId" 
            element={
              <ZoneDetailsPage
                zones={zones}
                onSelectZone={handleSelectZone}
                onToggleStale={handleToggleStale}
                onOpenCVModal={() => setIsCVModalOpen(true)}
              />
            } 
          />

          <Route 
            path="/incidents" 
            element={
              <IncidentsListPage
                incidents={incidents}
              />
            } 
          />

          <Route 
            path="/incident/:incidentId" 
            element={
              <IncidentDetailsPage
                incidents={incidents}
                zones={zones}
              />
            } 
          />
        </Routes>
      </main>

      {/* Modals & Drawers */}
      <CameraInspectorModal
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
        selectedZone={currentSelectedZone}
        onApplyCVResult={handleApplyCVResult}
      />

      <DemoController
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        currentScenarioId={currentScenarioId}
        onTriggerScenario={handleTriggerScenario}
        selectedZoneId={selectedZoneId}
        onToggleStale={handleToggleStale}
        isStale={currentSelectedZone?.stale}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
