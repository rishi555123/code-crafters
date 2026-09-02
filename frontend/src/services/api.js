import axios from 'axios';
import { DEFAULT_ZONES, DEMO_SCENARIOS } from '../constants/zones';

const API_BASE_URL = '/api';

// Initial incidents list
let mockIncidents = [
  {
    id: "INC-2026-0810-01",
    zone_id: "SLOPE_C",
    zone_name: "Slope C - West Pit Wall",
    event_time: "2026-08-10T14:32:00.000Z",
    risk_score_before_event: 0.89,
    weather_conditions: "Heavy Rain (42mm), 86% Humidity",
    crack_severity: "HIGH",
    deformation_mm: 12.8,
    alert_sent: true,
    action_taken: "Personnel evacuated; haul road diverted to Bench 4",
    status: "RESOLVED"
  },
  {
    id: "INC-2026-0804-02",
    zone_id: "SLOPE_B",
    zone_name: "Slope B - South Working Bench",
    event_time: "2026-08-04T09:15:00.000Z",
    risk_score_before_event: 0.76,
    weather_conditions: "Moderate Rain (24mm), 78% Humidity",
    crack_severity: "MEDIUM",
    deformation_mm: 8.5,
    alert_sent: true,
    action_taken: "Temporary work pause for 4 hours; geotechnical survey completed",
    status: "RESOLVED"
  }
];

class ApiService {
  constructor() {
    this.zonesState = JSON.parse(JSON.stringify(DEFAULT_ZONES));
    this.useMockMode = false;
    this.stageHysteresisCounters = {}; // tracks consecutive high readings for hysteresis
  }

  setMockMode(enabled) {
    this.useMockMode = enabled;
  }

  isMockMode() {
    return this.useMockMode;
  }

  // Fetch all zones configuration
  async getZones() {
    if (this.useMockMode) {
      return this.zonesState.map(z => ({
        id: z.id,
        name: z.name,
        latitude: z.latitude,
        longitude: z.longitude,
        rock_type: z.rock_type,
        slope_angle: z.slope_angle,
        elevation_m: z.elevation_m,
      }));
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/zones`, { timeout: 3000 });
      return res.data;
    } catch (err) {
      console.warn('Backend /api/zones unreachable, falling back to local dataset', err.message);
      return this.zonesState.map(z => ({
        id: z.id,
        name: z.name,
        latitude: z.latitude,
        longitude: z.longitude,
        rock_type: z.rock_type,
        slope_angle: z.slope_angle,
        elevation_m: z.elevation_m,
      }));
    }
  }

  // Fetch current risk & telemetry for all zones or a specific zone
  async getCurrentRisk(zoneId = null) {
    if (this.useMockMode) {
      if (zoneId) {
        const zone = this.zonesState.find(z => z.id === zoneId);
        return zone ? { ...zone.initialState, zone_id: zone.id, latitude: zone.latitude, longitude: zone.longitude } : null;
      }
      return this.zonesState.map(z => ({
        zone_id: z.id,
        zone_name: z.name,
        latitude: z.latitude,
        longitude: z.longitude,
        ...z.initialState
      }));
    }

    try {
      const url = zoneId ? `${API_BASE_URL}/current-risk?zone_id=${zoneId}` : `${API_BASE_URL}/current-risk`;
      const res = await axios.get(url, { timeout: 3000 });
      
      // If backend returns a single object and no zoneId was specified, wrap or map
      if (res.data && !Array.isArray(res.data) && !zoneId) {
        // Match against known zones
        return this.zonesState.map(z => {
          if (z.id === res.data.zone_id) {
            return { ...z.initialState, ...res.data };
          }
          return { zone_id: z.id, zone_name: z.name, latitude: z.latitude, longitude: z.longitude, ...z.initialState };
        });
      }
      return res.data;
    } catch (err) {
      // Graceful fallback to mock data
      if (zoneId) {
        const zone = this.zonesState.find(z => z.id === zoneId);
        return zone ? { ...zone.initialState, zone_id: zone.id, latitude: zone.latitude, longitude: zone.longitude } : null;
      }
      return this.zonesState.map(z => ({
        zone_id: z.id,
        zone_name: z.name,
        latitude: z.latitude,
        longitude: z.longitude,
        ...z.initialState
      }));
    }
  }

  // Fetch Incident History
  async getIncidents() {
    if (this.useMockMode) {
      return [...mockIncidents];
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/incidents`, { timeout: 3000 });
      return res.data;
    } catch (err) {
      return [...mockIncidents];
    }
  }

  // Submit CV image for analysis
  async analyzeCVImage(file, zoneId) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('zone_id', zoneId);

    try {
      const res = await axios.post(`${API_BASE_URL}/analysis/cv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000
      });
      return res.data;
    } catch (err) {
      console.warn('Backend CV API unavailable, generating local inference result', err.message);
      // Simulated CV Inference
      const hasCrack = Math.random() > 0.3;
      const deformation = hasCrack ? Number((Math.random() * 10 + 3).toFixed(1)) : Number((Math.random() * 2).toFixed(1));
      const severities = ['LOW', 'MEDIUM', 'HIGH'];
      const crack_severity = hasCrack ? severities[Math.floor(Math.random() * severities.length)] : 'NONE';
      
      return {
        zone_id: zoneId,
        timestamp: new Date().toISOString(),
        crack_detected: hasCrack,
        crack_severity: crack_severity,
        deformation_mm: deformation,
        crack_confidence: hasCrack ? Number((0.85 + Math.random() * 0.14).toFixed(2)) : 0.05
      };
    }
  }

  // Apply Master Plan Demo Scenario to a target zone
  applyDemoScenario(scenarioId, targetZoneId = "SLOPE_A") {
    const scenario = DEMO_SCENARIOS[scenarioId];
    if (!scenario) return null;

    const zone = this.zonesState.find(z => z.id === targetZoneId);
    if (!zone) return null;

    // Hysteresis Logic: For Stage 3 (HIGH risk), require 2 consecutive readings
    if (scenario.id === 3) {
      const currentCount = (this.stageHysteresisCounters[targetZoneId] || 0) + 1;
      this.stageHysteresisCounters[targetZoneId] = currentCount;

      if (currentCount < 2) {
        // First high reading: keep alert pending
        zone.initialState = {
          ...zone.initialState,
          ...scenario.state,
          alert_sent: false, // Not yet fired until 2nd consecutive reading
          hysteresis_step: "Reading 1/2 (Validating spike...)",
          last_updated: new Date().toISOString()
        };
        return { zone, scenario, hysteresisFired: false, count: currentCount };
      } else {
        // Second consecutive high reading: FIRING ALERT!
        zone.initialState = {
          ...zone.initialState,
          ...scenario.state,
          alert_sent: true,
          hysteresis_step: "Reading 2/2 (Alert confirmed!)",
          last_updated: new Date().toISOString()
        };
        return { zone, scenario, hysteresisFired: true, count: currentCount };
      }
    } else {
      // Reset hysteresis counter when leaving high risk
      this.stageHysteresisCounters[targetZoneId] = 0;
    }

    zone.initialState = {
      ...zone.initialState,
      ...scenario.state,
      hysteresis_step: null,
      last_updated: new Date().toISOString()
    };

    // Stage 4: Trigger rockfall event and add to incidents
    if (scenarioId === 4) {
      const newIncident = {
        id: `INC-${Date.now().toString().slice(-6)}`,
        zone_id: zone.id,
        zone_name: zone.name,
        event_time: new Date().toISOString(),
        risk_score_before_event: scenario.state.risk_score,
        weather_conditions: `Rain (${scenario.state.rainfall_mm}mm), ${scenario.state.humidity}% Humidity`,
        crack_severity: scenario.state.crack_severity,
        deformation_mm: scenario.state.deformation_mm,
        alert_sent: true,
        action_taken: "CRITICAL: Automated siren initiated, slope access barred",
        status: "ACTIVE EMERGENCY"
      };
      mockIncidents = [newIncident, ...mockIncidents];
    }

    return { zone, scenario, hysteresisFired: false, count: 0 };
  }

  // Toggle STALE status for a zone
  toggleStale(zoneId) {
    const zone = this.zonesState.find(z => z.id === zoneId);
    if (zone) {
      zone.initialState.stale = !zone.initialState.stale;
      if (zone.initialState.stale) {
        zone.initialState.last_updated = new Date(Date.now() - 35 * 60 * 1000).toISOString();
      } else {
        zone.initialState.last_updated = new Date().toISOString();
      }
      return zone.initialState.stale;
    }
    return false;
  }
}

export const apiService = new ApiService();

