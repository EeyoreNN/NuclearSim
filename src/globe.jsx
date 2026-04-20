// Orthographic globe — pure SVG, no external deps.
// Supports: country outlines (coarse), graticule, entity markers, great-circle arcs,
// SAM/ABM domes, radar rings, detonation rings, pan (drag to rotate), zoom.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
const COARSE_WORLD = window.COARSE_WORLD;

// ---- Orthographic projection ----
// Rotate lambda (long) by -lon0, phi (lat) by -lat0, then project.
// Returns [x, y, visible]
function project(lat, lon, rotLon, rotLat, radius) {
  const dlon = (lon - rotLon) * Math.PI / 180;
  const la = lat * Math.PI / 180;
  const la0 = rotLat * Math.PI / 180;
  const cosc = Math.sin(la0) * Math.sin(la) + Math.cos(la0) * Math.cos(la) * Math.cos(dlon);
  if (cosc < -1e-6) return [0, 0, false];
  const x = radius * Math.cos(la) * Math.sin(dlon);
  const y = radius * (Math.cos(la0) * Math.sin(la) - Math.sin(la0) * Math.cos(la) * Math.cos(dlon));
  return [x, -y, true];
}

// Great-circle interpolation points
function gcPath(a, b, n = 48) {
  const [lat1, lon1] = a, [lat2, lon2] = b;
  const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
  const λ1 = lon1 * Math.PI/180, λ2 = lon2 * Math.PI/180;
  const Δ = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2-φ1)/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin((λ2-λ1)/2)**2
  ));
  if (Δ < 1e-9) return [[lat1, lon1]];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const f = i/n;
    const A = Math.sin((1-f)*Δ) / Math.sin(Δ);
    const B = Math.sin(f*Δ) / Math.sin(Δ);
    const x = A*Math.cos(φ1)*Math.cos(λ1) + B*Math.cos(φ2)*Math.cos(λ2);
    const y = A*Math.cos(φ1)*Math.sin(λ1) + B*Math.cos(φ2)*Math.sin(λ2);
    const z = A*Math.sin(φ1) + B*Math.sin(φ2);
    const φ = Math.atan2(z, Math.sqrt(x*x+y*y));
    const λ = Math.atan2(y, x);
    out.push([φ*180/Math.PI, λ*180/Math.PI]);
  }
  return out;
}

// Build a projected polyline, splitting where it leaves the visible hemisphere.
function projectPolyline(coords, rotLon, rotLat, R, cx, cy) {
  const segs = [];
  let cur = [];
  for (const [lat, lon] of coords) {
    const [x, y, v] = project(lat, lon, rotLon, rotLat, R);
    if (v) cur.push([x+cx, y+cy]);
    else { if (cur.length > 1) segs.push(cur); cur = []; }
  }
  if (cur.length > 1) segs.push(cur);
  return segs;
}

function pathFromSegs(segs) {
  return segs.map(s => 'M' + s.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L') + ' Z').join(' ');
}

// Radius on screen from km distance at the tangent point (approx)
function kmToPx(km, R) {
  const earthKm = 6371;
  // arc length ≈ angle (rad) * R(screen)
  const angle = km / earthKm;
  return Math.sin(angle) * R;
}

// ---- Globe component ----
function Globe({
  width, height,
  nations, cities, entities, detonations, events,
  selectedId, onSelect,
  filters, overlays,
  playheadT,
  onHoverEntity,
  countriesData,
}) {
  const [rot, setRot] = useState({ lon: -30, lat: 20 });
  const [zoom, setZoom] = useState(1.0);
  const [drag, setDrag] = useState(null);
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [tick, setTick] = useState(0);

  // Animate (very slight — missiles move along arcs)
  useEffect(() => {
    let raf;
    const loop = () => { setTick(t => t + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cx = width/2, cy = height/2;
  const baseR = Math.min(width, height) * 0.42;
  const R = baseR * zoom;

  // --- Mouse handlers ---
  const onMouseDown = (e) => {
    setDrag({ x: e.clientX, y: e.clientY, rot: { ...rot } });
  };
  const onMouseMove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    setRot({
      lon: drag.rot.lon - dx * 0.3 / zoom,
      lat: Math.max(-85, Math.min(85, drag.rot.lat + dy * 0.3 / zoom)),
    });
  };
  const onMouseUp = () => setDrag(null);
  const onWheel = (e) => {
    // Only zoom when user holds Shift or Ctrl/Cmd — otherwise let page scroll
    if (!(e.shiftKey || e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const d = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.55, Math.min(4, z * d)));
  };
  const zoomIn  = () => setZoom(z => Math.min(4, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(0.55, z / 1.2));
  const resetView = () => { setZoom(1); setRot({ lon:-30, lat:20 }); };

  // --- Graticule ---
  const graticule = useMemo(() => {
    const paths = [];
    for (let lat = -80; lat <= 80; lat += 20) {
      const line = [];
      for (let lon = -180; lon <= 180; lon += 4) line.push([lat, lon]);
      paths.push(line);
    }
    for (let lon = -180; lon <= 180; lon += 20) {
      const line = [];
      for (let lat = -85; lat <= 85; lat += 4) line.push([lat, lon]);
      paths.push(line);
    }
    return paths;
  }, []);

  // --- Project countries on each render ---
  const countryPath = useMemo(() => {
    if (!countriesData) return '';
    const parts = [];
    for (const ring of countriesData) {
      const segs = projectPolyline(ring, rot.lon, rot.lat, R, cx, cy);
      if (segs.length) parts.push(pathFromSegs(segs));
    }
    return parts.join(' ');
  }, [countriesData, rot.lon, rot.lat, R, cx, cy]);

  const gratPath = useMemo(() => {
    const parts = [];
    for (const line of graticule) {
      const segs = projectPolyline(line, rot.lon, rot.lat, R, cx, cy);
      if (segs.length) parts.push(pathFromSegs(segs));
    }
    return parts.join(' ');
  }, [graticule, rot.lon, rot.lat, R, cx, cy]);

  // Filter entities
  const visibleEntities = entities.filter(e => {
    if (filters.classes && !filters.classes[e.cls] && !Object.values(filters.classes).every(v=>!v)) {
      // If a class filter is set and this class isn't in it, hide
      if (!filters.classes[e.cls]) return false;
    }
    if (filters.sides && !filters.sides[e.side]) return false;
    return true;
  });

  // Project entities
  const projectedEntities = visibleEntities.map(e => {
    const [lat, lon] = e.pos;
    const [x, y, v] = project(lat, lon, rot.lon, rot.lat, R);
    return { ent: e, x: x+cx, y: y+cy, visible: v };
  }).filter(p => p.visible);

  // Project cities
  const projectedCities = cities.map(c => {
    const [lat, lon] = c.pos;
    const [x, y, v] = project(lat, lon, rot.lon, rot.lat, R);
    return { city: c, x: x+cx, y: y+cy, visible: v };
  }).filter(p => p.visible);

  // Arcs for in-flight missiles
  const missiles = visibleEntities.filter(e =>
    ['icbm','slbm','mrbm','srbm','cruise_alcm','cruise_slcm','cruise_glcm','abm_interceptor','sam_interceptor'].includes(e.cls)
    && e.origin && e.destination
  );

  // --- Render ---
  // Listen for external zoom commands
  useEffect(() => {
    const h = (e) => {
      if (e.detail === 'in') zoomIn();
      else if (e.detail === 'out') zoomOut();
      else if (e.detail === 'reset') resetView();
    };
    window.addEventListener('globe-zoom', h);
    return () => window.removeEventListener('globe-zoom', h);
  }, []);

  return (
    <svg
      ref={svgRef}
      className="globe-svg"
      width={width} height={height}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      style={{ cursor: drag ? 'grabbing' : 'grab' }}
    >
      <defs>
        <clipPath id="globe-clip">
          <circle cx={cx} cy={cy} r={R} />
        </clipPath>
        <radialGradient id="ocean" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0d1217"/>
          <stop offset="70%" stopColor="#0a0d11"/>
          <stop offset="100%" stopColor="#060809"/>
        </radialGradient>
        <filter id="det-blur"><feGaussianBlur stdDeviation="0.5"/></filter>
      </defs>

      {/* Limb / ocean */}
      <circle cx={cx} cy={cy} r={R} fill="url(#ocean)" stroke="#2a323c" strokeWidth="1"/>

      <g clipPath="url(#globe-clip)">
        {/* Graticule */}
        <path d={gratPath} fill="none" stroke="#1a2028" strokeWidth="0.5" opacity="0.7"/>

        {/* Countries — fill + same-color stroke so internal borders blend but coastlines stay crisp */}
        {countryPath && (
          <path d={countryPath} fill="#151c25" stroke="#151c25" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
        )}
        {/* Coastline overlay — faint contour line */}
        {countryPath && (
          <path d={countryPath} fill="none" stroke="#3a4553" strokeWidth="0.35" strokeOpacity="0.7" strokeLinejoin="round"/>
        )}

        {/* Radar rings (sensors) */}
        {overlays.radar && entities.filter(e =>
          (e.cls === 'radar_site' || e.cls === 'abm_site' || e.cls === 'satellite_early_warning' || e.cls === 'oth_radar')
          && e.radar_range_km
        ).map(e => {
          const [lat, lon] = e.pos;
          const [x, y, v] = project(lat, lon, rot.lon, rot.lat, R);
          if (!v) return null;
          const r = kmToPx(e.radar_range_km, R);
          const c = window.NATO.colorFor(e.side);
          return (
            <g key={'r-'+e.id} transform={`translate(${x+cx},${y+cy})`}>
              <circle r={r} fill="none" stroke={c.stroke} strokeWidth="0.7" strokeDasharray="3 3" opacity="0.35"/>
              <circle r={r*0.5} fill="none" stroke={c.stroke} strokeWidth="0.4" strokeDasharray="2 4" opacity="0.2"/>
            </g>
          );
        })}

        {/* SAM/ABM coverage domes */}
        {overlays.domes && entities.filter(e => e.cls === 'sam_site' || e.cls === 'abm_site').map(e => {
          const [lat, lon] = e.pos;
          const [x, y, v] = project(lat, lon, rot.lon, rot.lat, R);
          if (!v) return null;
          const r = kmToPx(e.cls === 'abm_site' ? 1800 : (e.sub?.includes('S-400') ? 400 : 170), R);
          const c = window.NATO.colorFor(e.side);
          return (
            <g key={'d-'+e.id} transform={`translate(${x+cx},${y+cy})`}>
              <circle r={r} fill={c.fill} stroke={c.stroke} strokeWidth="0.8" opacity="0.5"/>
            </g>
          );
        })}

        {/* Detonation rings — 3rd-deg thermal, psi5, psi20 */}
        {detonations.map(d => {
          const [lat, lon] = d.pos;
          const [x, y, v] = project(lat, lon, rot.lon, rot.lat, R);
          if (!v) return null;
          const rTherm = kmToPx(d.thermal_3rd_deg_radius_km, R);
          const rPsi5 = kmToPx(d.psi5_radius_km, R);
          const rPsi20 = kmToPx(d.psi20_radius_km, R);
          return (
            <g key={'det-'+d.id} transform={`translate(${x+cx},${y+cy})`}>
              <circle r={rTherm} fill="rgba(196,122,58,0.08)" stroke="#c47a3a" strokeWidth="0.5" strokeDasharray="2 2"/>
              <circle r={rPsi5} fill="rgba(184,81,74,0.12)" stroke="#b8514a" strokeWidth="0.7"/>
              <circle r={rPsi20} fill="rgba(184,81,74,0.35)" stroke="#d86f68" strokeWidth="0.7"/>
              <circle r={2} fill="#f2a672"/>
              <circle r={6} fill="none" stroke="#c47a3a" strokeWidth="0.5"/>
            </g>
          );
        })}

        {/* Trajectories — great-circle arcs */}
        {overlays.arcs && missiles.map(m => {
          const pts = gcPath(m.origin, m.destination, 60);
          // split at progress index
          const cutIdx = Math.floor(m.progress * pts.length);
          const pastPts = pts.slice(0, cutIdx+1);
          const futurePts = pts.slice(cutIdx);
          const segPast = projectPolyline(pastPts, rot.lon, rot.lat, R, cx, cy);
          const segFuture = projectPolyline(futurePts, rot.lon, rot.lat, R, cx, cy);
          const c = window.NATO.colorFor(m.side);
          const isInterceptor = m.cls === 'abm_interceptor' || m.cls === 'sam_interceptor';
          return (
            <g key={'arc-'+m.id}>
              <path d={pathFromSegs(segPast)} fill="none"
                stroke={isInterceptor ? '#5a9a6a' : c.stroke}
                strokeWidth="1.2" opacity="0.85"/>
              <path d={pathFromSegs(segFuture)} fill="none"
                stroke={isInterceptor ? '#5a9a6a' : c.stroke}
                strokeWidth="0.8" strokeDasharray="3 3" opacity="0.45"/>
            </g>
          );
        })}

        {/* Cities */}
        {projectedCities.map(({ city, x, y }) => {
          const struck = detonations.some(d => d.target_city === city.id);
          return (
            <g key={'city-'+city.id} transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}
               onClick={(e) => { e.stopPropagation(); onSelect('city:'+city.id); }}>
              {city.is_capital && (
                <circle r={3.8} fill="none" stroke="#8a94a2" strokeWidth="0.8"/>
              )}
              <circle r={struck ? 2.5 : 1.5} fill={struck ? '#d86f68' : (city.is_capital ? '#d8dde4' : '#6a727c')}/>
              {(zoom > 1.1 || city.is_capital) && (
                <text x={5} y={3} fontSize="9" fill={struck ? '#d86f68' : '#9ba3ad'}
                  style={{ pointerEvents:'none', letterSpacing:'0.05em' }}>
                  {city.name.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

        {/* Entities */}
        {projectedEntities.map(({ ent, x, y }) => {
          const size = classSize(ent.cls);
          const sel = selectedId === ent.id;
          const c = window.NATO.colorFor(ent.side);
          const html = window.NATO.renderIcon({ cls: ent.cls, side: ent.side, size, state: ent.state });
          return (
            <g key={ent.id} transform={`translate(${x-size/2},${y-size/2})`}
               style={{ cursor:'pointer' }}
               onClick={(e) => { e.stopPropagation(); onSelect(ent.id); }}
               onMouseEnter={() => { setHover({ x: x, y: y, ent }); onHoverEntity && onHoverEntity(ent); }}
               onMouseLeave={() => { setHover(null); onHoverEntity && onHoverEntity(null); }}
               dangerouslySetInnerHTML={{ __html:
                 (sel ? `<rect x="-3" y="-3" width="${size+6}" height="${size+6}" fill="none" stroke="${c.stroke}" stroke-width="1"/>` : '')
                 + html
               }}
            />
          );
        })}

        {/* Hover tooltip line (to readout) */}
        {hover && (
          <line x1={hover.x} y1={hover.y} x2={hover.x + 30} y2={hover.y - 20}
            stroke="#5a6471" strokeWidth="0.6" strokeDasharray="2 2"/>
        )}
      </g>

      {/* Limb highlight */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#3a4049" strokeWidth="0.6"/>

      {/* Bearing ticks */}
      {[0,45,90,135,180,225,270,315].map(deg => {
        const a = (deg - 90) * Math.PI/180;
        const x1 = cx + Math.cos(a) * (R+2);
        const y1 = cy + Math.sin(a) * (R+2);
        const x2 = cx + Math.cos(a) * (R+7);
        const y2 = cy + Math.sin(a) * (R+7);
        const lx = cx + Math.cos(a) * (R+16);
        const ly = cy + Math.sin(a) * (R+16);
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a4049" strokeWidth="0.8"/>
            <text x={lx} y={ly} fontSize="8.5" fill="#5a6471" textAnchor="middle" dominantBaseline="middle"
              style={{ letterSpacing:'0.1em' }}>
              {String(deg).padStart(3,'0')}
            </text>
          </g>
        );
      })}

      {/* Center cursor (when hovering stage but not on entity) */}
      {!hover && (
        <g opacity="0.15">
          <line x1={cx-10} y1={cy} x2={cx+10} y2={cy} stroke="#8a94a2"/>
          <line x1={cx} y1={cy-10} x2={cx} y2={cy+10} stroke="#8a94a2"/>
        </g>
      )}
    </svg>
  );
}

function classSize(cls) {
  if (['icbm','slbm','mrbm'].includes(cls)) return 14;
  if (['cruise_alcm','cruise_slcm','cruise_glcm','srbm','abm_interceptor','sam_interceptor'].includes(cls)) return 12;
  if (['carrier','ssbn'].includes(cls)) return 18;
  if (['bomber','awacs','tanker'].includes(cls)) return 16;
  if (['city'].includes(cls)) return 6;
  return 14;
}

// Expose zoom controls via imperative ref pattern — use DOM custom event
window.Globe = Globe;
window.project = project;
window.gcPath = gcPath;
