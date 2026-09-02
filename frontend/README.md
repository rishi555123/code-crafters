# CODE CRAFTERS - AI Rockfall Prediction & Alert System (Frontend)
**Role Owner:** Vyshnavi Aitha (Frontend / React Dashboard)  
**Hackathon Team:** Code Crafters (SIH25071)

---

## 🌟 Overview
The **React Control-Room Dashboard** is the primary visual interface for mining safety operators, geotechnical engineers, and hackathon evaluators. It provides real-time geospatial slope stability monitoring, multi-sensor telemetry, AI crack detection inspection, and automated early warning alerts.

---

## 🚀 Key Features

### 1. 🗺️ Geospatial Mine Radar (Leaflet)
- Interactive satellite imagery, dark vector, and topographic map layers.
- Real-time color-coded zone markers:
  - 🟢 **LOW Risk (< 0.35)**: Stable baseline.
  - 🟡 **MEDIUM Risk (0.35 - 0.75)**: Elevated warning.
  - 🔴 **HIGH Risk (> 0.75)**: Critical hazard with animated pulsating beacon rings.
  - ⚪ **STALE**: Visual indicator when zone telemetry drops (>15 min timeout).
- Polygon boundary overlays for pit wall sectors (Slope A, Slope B, Slope C, Slope D).
- Interactive marker popups with live stats and quick telemetry inspection.

### 2. 🚨 High-Risk Emergency Alert Banner
- Dynamic top banner automatically triggered when `risk_level === 'HIGH'` / `alert_sent === true`.
- Integrated **Web Audio API synthesizer** playing real-time alternating sirens (with mute / un-mute control).
- Instant safety protocol directive and single-click evacuation / focus zone buttons.

### 3. 📊 Live Conditions & Telemetry Panel
- Multi-parameter live telemetry per selected slope sector:
  - **Risk Score Gauge** (0.00 to 1.00)
  - **CV Crack Severity** (NONE / LOW / MEDIUM / HIGH / CRITICAL)
  - **Slope Deformation (mm)** with threshold breach indicators
  - **Rainfall (mm/h)** & **Relative Humidity (%)**
  - **Bench Temperature (°C)**
  - **Seismic Vibration (mm/s)**
  - **Lithology & Slope Angle metadata**

### 4. 📈 Real-Time Telemetry Trendlines (Recharts)
- Live time-series charts tracking:
  - Continuous **Deformation (mm)** progression
  - **AI Risk Score** evolution over time
  - **Vibration & Rainfall** dual-axis correlation

### 5. 📷 Computer Vision Crack Inspector
- Live optical camera feed simulator (RGB, Contour Edges, Thermal modes).
- Integration with Srijani's YOLO + OpenCV inference model (`POST /api/analysis/cv`).
- Support for image upload and 3 preset rock crack testing scenarios.

### 6. 📋 Incident History View
- Complete geotechnical audit log pulling from `GET /api/incidents`.
- Filterable by zone and severity with pre-event risk scores and emergency actions taken.

### 7. 🎮 Built-in 4-Stage Demo Controller (Master Plan Section 6)
- **Stage 1 (Safe)**: No crack, 2mm deformation, 3mm rain $\rightarrow$ `0.18 LOW` (Green).
- **Stage 2 (Warning)**: Medium crack, 7mm deformation, 20mm rain $\rightarrow$ `0.61 MEDIUM` (Yellow).
- **Stage 3 (Critical)**: High crack, 12mm deformation, 42mm rain, high vibration $\rightarrow$ Demonstrates the **2-consecutive reading hysteresis** before triggering the high-risk alert banner!
- **Stage 4 (Rockfall Event)**: Peak hazard event logged dynamically into the Incident History table.
- **Edge Case: STALE Simulation**: Demonstrates network drop detection and visual stale badges.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
cd frontend
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
```

---

## 🔗 API Integration Points
- `GET /api/current-risk` — Live risk & telemetry state per zone
- `GET /api/incidents` — Historical rockfall events
- `GET /api/zones` — Zone geometries and metadata
- `POST /api/analysis/cv` — Multipart image upload for crack segmentation & deformation inference
