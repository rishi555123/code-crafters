import React, { useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polygon, 
  Circle,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers, 
  AlertTriangle, 
  ShieldCheck, 
  Radio, 
  Maximize2, 
  Compass, 
  Eye, 
  WifiOff 
} from 'lucide-react';

// Component to handle map center changes smoothly
function MapRecenter({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Create custom colored markers with SVG icons & glowing beacon rings
const createZoneIcon = (riskLevel, isStale, isSelected, zoneId) => {
  let color = '#10b981'; // green
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let bgClass = 'bg-emerald-500';
  let badgeText = 'LOW';

  if (isStale) {
    color = '#64748b'; // stale grey
    glowColor = 'rgba(100, 116, 139, 0.3)';
    bgClass = 'bg-slate-300';
    badgeText = 'STALE';
  } else if (riskLevel === 'HIGH') {
    color = '#ef4444'; // red
    glowColor = 'rgba(239, 68, 68, 0.8)';
    bgClass = 'bg-red-500';
    badgeText = 'HIGH';
  } else if (riskLevel === 'MEDIUM') {
    color = '#f59e0b'; // amber
    glowColor = 'rgba(245, 158, 11, 0.6)';
    bgClass = 'bg-amber-500';
    badgeText = 'MED';
  }

  const isHigh = riskLevel === 'HIGH' && !isStale;

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer">
      ${isHigh ? `
        <div class="absolute -inset-3 rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
        <div class="absolute -inset-2 rounded-full animate-pulse opacity-90" style="background-color: ${color}"></div>
      ` : ''}
      
      <div class="relative flex flex-col items-center">
        <div class="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs text-slate-900 shadow-xl transition-all duration-300 ${isSelected ? 'ring-4 ring-cyan-400 scale-110' : ''}" 
             style="background-color: ${color}; box-shadow: 0 0 15px ${glowColor}; border: 2px solid #ffffff;">
          ${zoneId ? zoneId.replace('SLOPE_', '') : 'Z'}
        </div>
        <span class="mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 shadow-sm"
              style="background-color: rgba(15, 23, 42, 0.9); border: 1px solid ${color};">
          ${badgeText}
        </span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-zone-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -25]
  });
};

export default function MineMap({
  zones = [],
  selectedZoneId = 'SLOPE_A',
  onSelectZone,
  className = ''
}) {
  const [mapType, setMapType] = useState('satellite'); // satellite, dark, topo

  const tileLayers = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Open-Pit Mine Remote Sensing'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
    }
  };

  const selectedZone = zones.find(z => z.zone_id === selectedZoneId || z.id === selectedZoneId) || zones[0];
  const centerPos = selectedZone ? [selectedZone.latitude, selectedZone.longitude] : [17.5400, 78.5700];

  const getPolygonColor = (zone) => {
    if (zone.stale) return '#64748b';
    if (zone.risk_level === 'HIGH') return '#ef4444';
    if (zone.risk_level === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex flex-col ${className}`}>
      {/* Top Map Header / Controls */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-200 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-50/80 rounded-lg border border-cyan-200/60 text-cyan-600">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Mine Pit Geospatial Radar</span>
              <span className="text-[11px] font-mono text-cyan-600 font-normal">Leaflet 1:5000</span>
            </h2>
          </div>
        </div>

        {/* Map Layer Switcher */}
        <div className="flex items-center gap-1 bg-white/95 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mapType === 'satellite' 
                ? 'bg-cyan-600 text-white font-bold shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapType('dark')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mapType === 'dark' 
                ? 'bg-cyan-600 text-white font-bold shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Dark Vector
          </button>
          <button
            onClick={() => setMapType('topo')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mapType === 'topo' 
                ? 'bg-cyan-600 text-white font-bold shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Topography
          </button>
        </div>
      </div>

      {/* Main Leaflet Map View */}
      <div className="relative w-full h-full min-h-[380px] lg:min-h-[460px]">
        <MapContainer
          center={centerPos}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ height: '100%', minHeight: '380px' }}
        >
          <TileLayer
            url={tileLayers[mapType].url}
            attribution={tileLayers[mapType].attribution}
            maxZoom={18}
          />

          <MapRecenter center={centerPos} zoom={15} />

          {/* Render Slope Sector Polygons */}
          {zones.map((zone) => {
            const isSelected = (zone.zone_id || zone.id) === selectedZoneId;
            const polyColor = getPolygonColor(zone);

            if (!zone.polygon) return null;

            return (
              <React.Fragment key={`poly-${zone.zone_id || zone.id}`}>
                <Polygon
                  positions={zone.polygon}
                  pathOptions={{
                    color: polyColor,
                    weight: isSelected ? 3 : 1.5,
                    opacity: 0.85,
                    fillColor: polyColor,
                    fillOpacity: isSelected ? 0.35 : 0.18,
                    dashArray: zone.stale ? '6, 6' : undefined
                  }}
                  eventHandlers={{
                    click: () => onSelectZone(zone.zone_id || zone.id)
                  }}
                />

                {/* Pulsing ring for HIGH risk */}
                {zone.risk_level === 'HIGH' && !zone.stale && (
                  <Circle
                    center={[zone.latitude, zone.longitude]}
                    radius={120}
                    pathOptions={{
                      color: '#ef4444',
                      weight: 2,
                      opacity: 0.6,
                      fillColor: '#ef4444',
                      fillOpacity: 0.15
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Render Zone Pin Markers */}
          {zones.map((zone) => {
            const zId = zone.zone_id || zone.id;
            const isSelected = zId === selectedZoneId;
            const icon = createZoneIcon(zone.risk_level, zone.stale, isSelected, zId);

            return (
              <Marker
                key={`marker-${zId}`}
                position={[zone.latitude, zone.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectZone(zId)
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[210px] text-slate-700">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <span className="font-bold text-sm text-slate-900">{zone.zone_name || zone.name || zId}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        zone.stale 
                          ? 'bg-slate-100 text-slate-600' 
                          : zone.risk_level === 'HIGH' 
                          ? 'bg-red-600 text-white animate-pulse' 
                          : zone.risk_level === 'MEDIUM' 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {zone.stale ? 'STALE' : zone.risk_level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Risk Score:</span>
                        <strong className="text-slate-900 text-sm">{Number(zone.risk_score).toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Deformation:</span>
                        <strong className="text-slate-900 text-sm">{zone.deformation_mm} mm</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Rainfall:</span>
                        <span className="text-cyan-700">{zone.rainfall_mm} mm</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Crack Severity:</span>
                        <span className="text-yellow-400">{zone.crack_severity || 'NONE'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectZone(zId)}
                      className="w-full mt-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-all text-center flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Telemetry</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/85 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl text-xs font-mono">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mine Risk Map Legend</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span className="text-slate-600">LOW (Risk &lt; 0.35) — Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              <span className="text-slate-600">MEDIUM (0.35 - 0.75) — Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse"></span>
              <span className="text-slate-600">HIGH (&gt; 0.75) — Evacuation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300"></span>
              <span className="text-slate-500">STALE — No Telemetry (&gt;15m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

