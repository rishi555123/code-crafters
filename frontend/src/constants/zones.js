// Default Zone Configurations & Geometries for Leaflet Map

export const DEFAULT_ZONES = [
  {
    id: "SLOPE_A",
    name: "Slope A - North Highwall",
    latitude: 17.5420,
    longitude: 78.5720,
    elevation_m: 480,
    rock_type: "Quartzite / Shale Interbed",
    slope_angle: "68°",
    polygon: [
      [17.5450, 78.5690],
      [17.5460, 78.5750],
      [17.5410, 78.5760],
      [17.5390, 78.5700],
    ],
    initialState: {
      risk_score: 0.18,
      risk_level: "LOW",
      crack_detected: false,
      crack_severity: "NONE",
      deformation_mm: 2.1,
      rainfall_mm: 3.2,
      humidity: 48,
      temperature: 28.5,
      vibration: 1.2,
      rockfall_occurred: false,
      alert_sent: false,
      stale: false,
      last_updated: new Date().toISOString()
    }
  },
  {
    id: "SLOPE_B",
    name: "Slope B - South Working Bench",
    latitude: 17.5350,
    longitude: 78.5680,
    elevation_m: 410,
    rock_type: "Granite / Basalt",
    slope_angle: "54°",
    polygon: [
      [17.5370, 78.5650],
      [17.5380, 78.5710],
      [17.5330, 78.5720],
      [17.5310, 78.5660],
    ],
    initialState: {
      risk_score: 0.61,
      risk_level: "MEDIUM",
      crack_detected: true,
      crack_severity: "MEDIUM",
      deformation_mm: 7.4,
      rainfall_mm: 19.8,
      humidity: 72,
      temperature: 26.0,
      vibration: 3.8,
      rockfall_occurred: false,
      alert_sent: false,
      stale: false,
      last_updated: new Date().toISOString()
    }
  },
  {
    id: "SLOPE_C",
    name: "Slope C - West Pit Wall",
    latitude: 17.5390,
    longitude: 78.5620,
    elevation_m: 450,
    rock_type: "Fractured Sandstone",
    slope_angle: "72°",
    polygon: [
      [17.5420, 78.5590],
      [17.5430, 78.5650],
      [17.5370, 78.5660],
      [17.5350, 78.5600],
    ],
    initialState: {
      risk_score: 0.89,
      risk_level: "HIGH",
      crack_detected: true,
      crack_severity: "HIGH",
      deformation_mm: 12.8,
      rainfall_mm: 42.5,
      humidity: 86,
      temperature: 25.2,
      vibration: 8.7,
      rockfall_occurred: true,
      alert_sent: true,
      stale: false,
      last_updated: new Date().toISOString()
    }
  },
  {
    id: "SLOPE_D",
    name: "Slope D - Eastern Haul Road Ramp",
    latitude: 17.5440,
    longitude: 78.5810,
    elevation_m: 390,
    rock_type: "Limestone Escarpment",
    slope_angle: "45°",
    polygon: [
      [17.5470, 78.5780],
      [17.5480, 78.5840],
      [17.5420, 78.5850],
      [17.5400, 78.5790],
    ],
    initialState: {
      risk_score: 0.22,
      risk_level: "LOW",
      crack_detected: false,
      crack_severity: "NONE",
      deformation_mm: 1.8,
      rainfall_mm: 5.0,
      humidity: 50,
      temperature: 29.0,
      vibration: 1.1,
      rockfall_occurred: false,
      alert_sent: false,
      stale: true, // STALE telemetry demo
      last_updated: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  }
];

// Master Plan Section 6 Demo Scenarios
export const DEMO_SCENARIOS = {
  1: {
    id: 1,
    title: "Stage 1: Safe Baseline",
    description: "Stable slope, no crack detected, 2mm deformation, 3mm rainfall.",
    expectedRisk: "0.18 — LOW (Green)",
    state: {
      risk_score: 0.18,
      risk_level: "LOW",
      crack_detected: false,
      crack_severity: "NONE",
      deformation_mm: 2.0,
      rainfall_mm: 3.0,
      humidity: 45,
      temperature: 28.0,
      vibration: 1.1,
      rockfall_occurred: false,
      alert_sent: false,
      stale: false,
    }
  },
  2: {
    id: 2,
    title: "Stage 2: Warning Alert",
    description: "Medium crack detected, 7mm deformation, 20mm rainfall.",
    expectedRisk: "0.61 — MEDIUM (Yellow)",
    state: {
      risk_score: 0.61,
      risk_level: "MEDIUM",
      crack_detected: true,
      crack_severity: "MEDIUM",
      deformation_mm: 7.0,
      rainfall_mm: 20.0,
      humidity: 74,
      temperature: 26.5,
      vibration: 4.2,
      rockfall_occurred: false,
      alert_sent: false,
      stale: false,
    }
  },
  3: {
    id: 3,
    title: "Stage 3: Critical Hazard (2x Hysteresis)",
    description: "High crack, 12mm deformation, 42mm rain, high vibration -> HIGH alert fires after 2 consecutive readings.",
    expectedRisk: "0.89 — HIGH (Red)",
    state: {
      risk_score: 0.89,
      risk_level: "HIGH",
      crack_detected: true,
      crack_severity: "HIGH",
      deformation_mm: 12.0,
      rainfall_mm: 42.0,
      humidity: 86,
      temperature: 24.8,
      vibration: 8.7,
      rockfall_occurred: false,
      alert_sent: true,
      stale: false,
    }
  },
  4: {
    id: 4,
    title: "Stage 4: Rockfall Event Triggered",
    description: "Event triggered at peak of Stage 3. Logged into Incident History table.",
    expectedRisk: "0.94 — HIGH (Event Logged)",
    state: {
      risk_score: 0.94,
      risk_level: "HIGH",
      crack_detected: true,
      crack_severity: "CRITICAL",
      deformation_mm: 18.5,
      rainfall_mm: 56.0,
      humidity: 92,
      temperature: 23.5,
      vibration: 14.2,
      rockfall_occurred: true,
      alert_sent: true,
      stale: false,
    }
  }
};

