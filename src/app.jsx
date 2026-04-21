import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
const uS = useState, uE = useEffect, uM = useMemo, uR = useRef, uC = useCallback;
// Pull globals populated by the side-effect imports (nato.js, data.js, world-data.js,
// globe.jsx, panels.jsx, sim-live.js).
const { SimData, SimLive, NATO, Globe, project, gcPath,
        NationsRail, RightRail, EventLog, Controls,
        LaunchOrderModal, FullInspectorModal,
        ShipOrderModal, AircraftOrderModal,
        formatNum, formatAlt, fmtLat, fmtLon, fmtDur } = window;

function App() {
  // --- Live connection state ---
  const [liveStatus, setLiveStatus] = uS('idle'); // idle|connecting|live|error|closed|fallback
  const [liveUrl, setLiveUrl] = uS(localStorage.getItem('nuke-sim-url') || 'ws://localhost:8765/stream');
  const [liveData, setLiveData] = uS(null); // {entities, cities, nations, events, metrics, hello} or null
  const [liveEnabled, setLiveEnabled] = uS(localStorage.getItem('nuke-sim-live') !== '0');
  const liveSeqRef = uR(0);

  // Decide data source — prefer live when connected, fallback to mock
  const useLive = liveEnabled && liveData && liveStatus === 'live';
  const nations = useLive ? liveData.nations : window.SimData.NATIONS;
  const cities = useLive ? liveData.cities : window.SimData.CITIES;
  // `entities` is declared below, after playheadT — see the useMemo tagged
  // "entities source" near the lookups block.
  const detonations = useLive
    ? (liveData.events.filter(e => e.kind === 'detonation').map(e => ({ ...(e.data||{}), t: e.t })))
    : window.SimData.DETONATIONS;
  const eventsAll = useLive ? liveData.events : window.SimData.EVENTS;
  const liveMetrics = useLive ? liveData.metrics : null;
  const maxT = 900;
  const t0 = useLive ? (liveData.hello?.sim_t0 || 0) : window.SimData.NOW_T;

  const [view, setView] = uS('ops');
  const [selId, setSelId] = uS(null);
  const [selectedNation, setSelectedNation] = uS('usa');
  const [logFilters, setLogFilters] = uS({});
  const [playing, setPlaying] = uS(true);
  const [playheadT, setPlayheadT] = uS(t0);
  const [timeScale, setTimeScale] = uS(1.0);
  const [showLaunchModal, setShowLaunchModal] = uS(false);
  const [showShipModal, setShowShipModal] = uS(false);
  const [showAircraftModal, setShowAircraftModal] = uS(false);
  const [fullInspectId, setFullInspectId] = uS(null);
  const [watchlist, setWatchlist] = uS(['wep-5','usn-ssbn-1']);
  const [stageSize, setStageSize] = uS({ w: 1000, h: 600 });
  const [wallclock, setWallclock] = uS(new Date('2026-04-20T18:13:00Z'));

  // Filter state
  const [filterClasses, setFilterClasses] = uS({
    silo: true, tel: true, sam_site: true, abm_site: true, radar_site: true, satellite_early_warning: true,
    icbm: true, slbm: true, cruise_alcm: true, cruise_slcm: true, cruise_glcm: true, mrbm: true, srbm: true,
    abm_interceptor: true, sam_interceptor: true,
    fighter: true, bomber: true, awacs: true, tanker: true,
    carrier: true, destroyer: true, cruiser: true, frigate: true,
    ssbn: true, ssn: true,
  });
  const [filterSides, setFilterSides] = uS({ usa: true, rus: true, chn: true, gbr: true, fra: true, prk: true, ind: true, pak: true, isr: true, irn: true });
  const [overlays, setOverlays] = uS({ arcs: true, domes: true, radar: true });

  // Resize stage to fit — ResizeObserver so the globe re-centers when
  // the stage column changes width (nav toggles, window resize, etc.)
  const stageRef = uR(null);
  uE(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setStageSize({ w: Math.max(400, Math.floor(r.width)), h: Math.max(300, Math.floor(r.height)) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // Persist playhead
  uE(() => {
    const saved = localStorage.getItem('nuke-sim-state');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.playheadT) setPlayheadT(s.playheadT);
        if (s.playing != null) setPlaying(s.playing);
        if (s.timeScale) setTimeScale(s.timeScale);
      } catch(e){}
    }
  }, []);
  uE(() => {
    localStorage.setItem('nuke-sim-state', JSON.stringify({ playheadT, playing, timeScale }));
  }, [playheadT, playing, timeScale]);

  // --- Live WebSocket connection ---
  uE(() => {
    if (!liveEnabled) {
      window.SimLive.disconnect();
      setLiveStatus('idle');
      setLiveData(null);
      return;
    }
    window.SimLive.connect({
      url: liveUrl,
      onStatus: (s) => setLiveStatus(s),
      onState: () => {
        // Snapshot at ≤10Hz to avoid excessive React churn
        const now = performance.now();
        if (now - (liveSeqRef.current || 0) < 100) return;
        liveSeqRef.current = now;
        setLiveData(window.SimLive.snapshot());
      },
      onEvents: () => setLiveData(window.SimLive.snapshot()),
      onMetrics: () => setLiveData(window.SimLive.snapshot()),
    });
    return () => window.SimLive.disconnect();
  }, [liveEnabled, liveUrl]);

  // Send pause/resume/time_scale to live server when toggled
  const dispatchSim = (cmd) => {
    if (liveEnabled && liveStatus === 'live') window.SimLive.send(cmd);
  };
  const setPlayingLive = (v) => {
    setPlaying(v);
    dispatchSim({ cmd: v ? 'resume' : 'pause' });
  };
  const setTimeScaleLive = (v) => {
    setTimeScale(v);
    dispatchSim({ cmd: 'set_time_scale', value: v });
  };

  // Playhead animation
  uE(() => {
    if (!playing) return;
    let last = performance.now();
    let raf;
    const loop = (now) => {
      const dt = (now - last) / 1000; last = now;
      setPlayheadT(t => Math.min(maxT, t + dt * timeScale));
      setWallclock(wc => new Date(wc.getTime() + dt * 1000 * timeScale));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, timeScale]);

  // Entities source — in live mode pass through the server snapshot;
  // in mock mode advance each in-flight missile along its arc using the playhead.
  const entities = uM(() => {
    if (useLive) return liveData.entities;
    const src = window.SimData.ENT;
    const t0ref = window.SimData.NOW_T;
    const dt = Math.max(0, playheadT - t0ref);
    return src.map(e => {
      if (!e.origin || !e.destination) return e;
      const p0 = e.progress ?? 0;
      const etaRem = e.impact_eta_s ?? 600;
      const total = etaRem / Math.max(0.001, 1 - p0);
      const p = Math.min(1, p0 + dt / total);
      const [lat1, lon1] = e.origin, [lat2, lon2] = e.destination;
      const lat = lat1 + (lat2 - lat1) * p;
      const lon = lon1 + (lon2 - lon1) * p;
      const alt = Math.sin(p * Math.PI) * 800_000;
      return { ...e, progress: p, pos: [lat, lon, alt], state: p >= 1 ? 'impact' : e.state };
    });
  }, [useLive, liveData, playheadT]);

  // Lookups
  const entitiesById = uM(() => Object.fromEntries(entities.map(e => [e.id, e])), [entities]);
  const citiesById = uM(() => Object.fromEntries(cities.map(c => [c.id, c])), [cities]);

  // Global metrics (computed from current data)
  const metrics = uM(() => {
    const missiles = entities.filter(e => ['icbm','slbm','mrbm','srbm','cruise_alcm','cruise_slcm','cruise_glcm'].includes(e.cls));
    const interceptors = entities.filter(e => ['abm_interceptor','sam_interceptor'].includes(e.cls));
    return {
      missiles_in_flight: missiles.length,
      warheads_in_flight: missiles.reduce((a, m) => a + (m.warheads_count || 1), 0),
      intercepts_attempted: 6,
      intercepts_successful: 1,
      detonations: detonations.length,
      estimated_casualties_total: 126500,
    };
  }, [entities, detonations]);

  // Filter cities: show capitals + cities near detonations always; others dimmed
  const visibleCities = cities;

  const handleAddWatch = (id) => {
    setWatchlist(w => w.includes(id) ? w : [...w, id]);
  };
  const handleRemoveWatch = (id) => setWatchlist(w => w.filter(x => x !== id));

  const handleSubmitOrder = (order) => {
    console.log('ORDER TRANSMITTED', order);
    setShowLaunchModal(false);
    if (liveEnabled && liveStatus === 'live') {
      window.SimLive.send(order);
    } else {
      alert('ORDER TRANSMITTED (MOCK — not connected)\n\n' + JSON.stringify(order, null, 2));
    }
  };
  const handleSubmitShip = (order) => {
    setShowShipModal(false);
    if (liveEnabled && liveStatus === 'live') window.SimLive.send(order);
    else alert('SHIP ORDER (MOCK)\n\n' + JSON.stringify(order, null, 2));
  };
  const handleSubmitAircraft = (order) => {
    setShowAircraftModal(false);
    if (liveEnabled && liveStatus === 'live') window.SimLive.send(order);
    else alert('AIRCRAFT ORDER (MOCK)\n\n' + JSON.stringify(order, null, 2));
  };

  const visibleEntitiesForFilter = {
    classes: filterClasses,
    sides: filterSides,
  };

  // Class filter groups
  const classGroups = [
    { key:'installations', label:'INSTALL', classes:['silo','tel','sam_site','abm_site','radar_site','satellite_early_warning'] },
    { key:'missiles',      label:'MSL',     classes:['icbm','slbm','mrbm','srbm','cruise_alcm','cruise_slcm','cruise_glcm'] },
    { key:'interceptors',  label:'INT',     classes:['abm_interceptor','sam_interceptor'] },
    { key:'aircraft',      label:'AIR',     classes:['fighter','bomber','awacs','tanker'] },
    { key:'naval',         label:'NAV',     classes:['carrier','destroyer','cruiser','frigate','ssbn','ssn'] },
  ];
  const toggleGroup = (grp) => {
    const anyOn = grp.classes.some(c => filterClasses[c]);
    const next = { ...filterClasses };
    grp.classes.forEach(c => next[c] = !anyOn);
    setFilterClasses(next);
  };

  const toggleSide = (side) => setFilterSides(s => ({ ...s, [side]: !s[side] }));

  return (
    <>
      <div className="app">
        {/* Header */}
        <header className="hdr">
          <div className="hdr-brand">
            <div className="hdr-brand-mark"/>
            <span>NUCLEAR CONFLICT SIM · SCN WW3_2030</span>
          </div>

          <div className="hdr-nav">
            {['ops','forces','intel','replay','scenarios'].map(v => (
              <button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>
                {v[0].toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>

          <div className="hdr-clock">
            <div>
              <span className="lbl">T+ </span>
              <span className="val">{window.fmtDur(playheadT)}</span>
            </div>
            <div>
              <span className="lbl">WALLCLOCK </span>
              <span className="val">{wallclock.toISOString().slice(11,19)}Z</span>
            </div>
            <div>
              <span className="lbl">TICK </span>
              <span className="val">10Hz</span>
            </div>
          </div>

          <div className="hdr-defcon">
            <span className="dot"/> DEFCON 1 · GLOBAL
          </div>

          <div className="hdr-conn" onClick={()=>{
            const u = prompt('WebSocket URL (ws://host:port/stream):', liveUrl);
            if (u != null) {
              localStorage.setItem('nuke-sim-url', u);
              setLiveUrl(u);
            }
          }} title="Click to change WS URL · Shift-click to toggle live/mock"
             onMouseDown={(e)=>{
               if (e.shiftKey) {
                 e.preventDefault();
                 const next = !liveEnabled;
                 localStorage.setItem('nuke-sim-live', next?'1':'0');
                 setLiveEnabled(next);
               }
             }}
             style={{ cursor:'pointer' }}>
            <span className="dot" style={{
              background: liveStatus === 'live' ? 'var(--ok)' :
                          liveStatus === 'connecting' ? 'var(--warn)' :
                          liveStatus === 'closed' || liveStatus === 'error' ? 'var(--hot)' :
                          'var(--text-3)'
            }}/>
            {!liveEnabled ? 'MOCK DATA · live off' :
             liveStatus === 'live' ? <>WS LIVE · <span style={{ color:'var(--text-3)' }}>{liveUrl.replace(/^wss?:\/\//,'').replace('/stream','')}</span></> :
             liveStatus === 'connecting' ? <>CONNECTING · {liveUrl.replace(/^wss?:\/\//,'').replace('/stream','')}</> :
             liveStatus === 'closed' || liveStatus === 'error' ? <>WS DOWN · fallback mock</> :
             'WS IDLE'}
          </div>
        </header>

        {/* Left: nations */}
        <NationsRail nations={nations} selectedNation={selectedNation} onSelect={setSelectedNation}/>

        {/* Center: globe */}
        <div className="stage" ref={stageRef}>
          <div className="globe-wrap">
            <Globe
              width={stageSize.w} height={stageSize.h}
              nations={nations}
              cities={visibleCities}
              entities={entities}
              detonations={detonations}
              events={eventsAll}
              selectedId={selId}
              onSelect={setSelId}
              filters={visibleEntitiesForFilter}
              overlays={overlays}
              playheadT={playheadT}
              countriesData={window.COARSE_WORLD}
            />
          </div>

          {/* Top filter bar */}
          <div className="stage-top">
            <div className="filter-group">
              <span className="grp-label">CLS</span>
              {classGroups.map(g => {
                const on = g.classes.some(c => filterClasses[c]);
                return (
                  <button key={g.key} className={'tchip ' + (on ? 'on' : 'off')}
                    onClick={()=>toggleGroup(g)}>
                    {g.label}
                  </button>
                );
              })}
              <span className="grp-label" style={{ marginLeft: 6 }}>SIDE</span>
              {['usa','rus','chn','gbr','fra','prk','ind','pak'].map(s => (
                <button key={s} className={'tchip ' + (filterSides[s] ? 'on' : 'off')}
                  onClick={()=>toggleSide(s)}
                  style={{
                    borderColor: filterSides[s] ? (
                      ['usa','gbr','fra','isr','jpn','kor','aus'].includes(s) ? 'var(--friendly)' :
                      ['rus','chn','prk','irn'].includes(s) ? 'var(--hostile)' : 'var(--unknown)'
                    ) : undefined
                  }}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="filter-group">
              <span className="grp-label">OVL</span>
              <button className={'tchip ' + (overlays.arcs ? 'on' : 'off')}
                onClick={()=>setOverlays(o=>({ ...o, arcs:!o.arcs }))}>TRAJ</button>
              <button className={'tchip ' + (overlays.domes ? 'on' : 'off')}
                onClick={()=>setOverlays(o=>({ ...o, domes:!o.domes }))}>SAM/ABM DOME</button>
              <button className={'tchip ' + (overlays.radar ? 'on' : 'off')}
                onClick={()=>setOverlays(o=>({ ...o, radar:!o.radar }))}>RADAR</button>
            </div>
          </div>

          {/* Bottom-left compass / scale */}
          <div className="stage-compass">
            <div>PROJECTION ORTHOGRAPHIC · WGS84</div>
            <div>DRAG TO ROTATE · SHIFT+SCROLL TO ZOOM</div>
          </div>

          {/* Zoom controls */}
          <div style={{ position:'absolute', right:10, top:60, zIndex:5, display:'flex', flexDirection:'column', gap:2 }}>
            <button className="btn sm" style={{ width:28, padding:'4px 0' }} onClick={()=>window.dispatchEvent(new CustomEvent('globe-zoom',{detail:'in'}))}>+</button>
            <button className="btn sm" style={{ width:28, padding:'4px 0' }} onClick={()=>window.dispatchEvent(new CustomEvent('globe-zoom',{detail:'out'}))}>−</button>
            <button className="btn sm ghost" style={{ width:28, padding:'4px 0', fontSize:9 }} onClick={()=>window.dispatchEvent(new CustomEvent('globe-zoom',{detail:'reset'}))}>⟲</button>
          </div>

          {/* Global metrics panel */}
          <div className="stage-metrics">
            <h4>Global · {window.fmtDur(playheadT)}</h4>
            <div className="metric-row"><span className="k">Missiles in flight</span><span className="v warn">{metrics.missiles_in_flight}</span></div>
            <div className="metric-row"><span className="k">Warheads in flight</span><span className="v hot">{metrics.warheads_in_flight}</span></div>
            <div className="metric-row"><span className="k">Intercepts attempt</span><span className="v">{metrics.intercepts_attempted}</span></div>
            <div className="metric-row"><span className="k">Intercepts hit</span><span className="v ok">{metrics.intercepts_successful}</span></div>
            <div className="metric-row"><span className="k">Detonations</span><span className="v hot">{metrics.detonations}</span></div>
            <div className="metric-row"><span className="k">Est. casualties</span><span className="v hot">{window.formatNum(metrics.estimated_casualties_total)}</span></div>
          </div>
        </div>

        {/* Right rail */}
        <RightRail
          sel={selId}
          entitiesById={entitiesById}
          citiesById={citiesById}
          detonations={detonations}
          watchlist={watchlist}
          onOpenInspector={setFullInspectId}
          onAddWatch={handleAddWatch}
          onRemoveWatch={handleRemoveWatch}
        />

        {/* Bottom bar */}
        <div className="logbar">
          <EventLog
            events={eventsAll}
            playheadT={playheadT}
            filters={logFilters}
            onToggleFilter={(k)=>setLogFilters(f=>({ ...f, [k]: f[k] === false ? true : false }))}
            onEventClick={(e)=>{
              // jump focus
              if (e.actors && e.actors[0] && entitiesById[e.actors[0]]) setSelId(e.actors[0]);
            }}
          />
          <Controls
            playheadT={playheadT}
            maxT={maxT}
            playing={playing}
            timeScale={timeScale}
            onPlay={()=>setPlayingLive(true)}
            onPause={()=>setPlayingLive(false)}
            onStep={()=>{ setPlayheadT(t=>Math.min(maxT, t+1)); dispatchSim({ cmd:'step', ticks: 1 }); }}
            onScrub={(t)=>{ setPlayheadT(t); setPlayingLive(false); }}
            onScale={setTimeScaleLive}
            events={eventsAll}
            onOpenLaunchModal={()=>setShowLaunchModal(true)}
            onOpenShipModal={()=>setShowShipModal(true)}
            onOpenAircraftModal={()=>setShowAircraftModal(true)}
            onSaveState={()=>alert('STATE SAVED → snap_' + Date.now().toString(36) + '.json')}
          />
        </div>
      </div>

      {showLaunchModal && (
        <LaunchOrderModal
          nations={nations}
          targets={window.SimData.TARGETS_CATALOG}
          onClose={()=>setShowLaunchModal(false)}
          onSubmit={handleSubmitOrder}
        />
      )}

      {showShipModal && (
        <ShipOrderModal
          ships={entities.filter(e => ['carrier','destroyer','cruiser','frigate','ssbn','ssn','ssk'].includes(e.cls))}
          onClose={()=>setShowShipModal(false)}
          onSubmit={handleSubmitShip}
        />
      )}

      {showAircraftModal && (
        <AircraftOrderModal
          aircraft={entities.filter(e => ['fighter','bomber','awacs','tanker','elint','combat_uav','recon_uav'].includes(e.cls))}
          onClose={()=>setShowAircraftModal(false)}
          onSubmit={handleSubmitAircraft}
        />
      )}

      {fullInspectId && (
        <FullInspectorModal
          id={fullInspectId}
          entitiesById={entitiesById}
          citiesById={citiesById}
          detonations={detonations}
          onClose={()=>setFullInspectId(null)}
        />
      )}
    </>
  );
}

export default App;
