// UI panels — nations rail, inspector, event log, controls, modals.

import React, { useState, useEffect, useMemo, useRef } from 'react';
const useS = useState, useE = useEffect, useM = useMemo, useR = useRef;
const SimData = window.SimData;
const NATO = window.NATO;

// ---- Left rail: nations ----
function NationsRail({ nations, selectedNation, onSelect, metrics }) {
  return (
    <div className="panel rail-l">
      <div className="panel-hdr">
        <span>Nations</span>
        <span className="count">{nations.length}</span>
      </div>
      <div className="panel-body">
        {nations.map(n => (
          <NationRow key={n.code} n={n}
            selected={selectedNation === n.code}
            onClick={() => onSelect(n.code)}/>
        ))}
      </div>
    </div>
  );
}

function NationRow({ n, selected, onClick }) {
  const dotCls = n.side === 'blue' ? 'blue' : n.side === 'red' ? 'red' : 'yel';
  return (
    <div className={'nation' + (selected ? ' selected' : '')} onClick={onClick}>
      <div className="nation-top">
        <div className="nation-flag"><NationFlag code={n.code}/></div>
        <div className="nation-code">{n.code.toUpperCase()}</div>
        <div className="nation-name">{n.name}</div>
        <div className={'nation-side-dot ' + dotCls}/>
      </div>
      <div className="nation-grid">
        <Stat k="ICBM" v={n.icbm_remaining}/>
        <Stat k="SLBM" v={n.slbm_remaining}/>
        <Stat k="ALCM" v={n.alcm_remaining}/>
        <Stat k="BMB-A" v={n.bombers_airborne}/>
        <Stat k="FTR-A" v={n.fighters_airborne}/>
        <Stat k="STRK" v={n.cities_struck ?? 0} hot={n.cities_struck > 0}/>
      </div>
      <div className="nation-meta">
        <span className={'chip def' + n.defcon}>DEFCON {n.defcon}</span>
        <span className={'chip ' + (n.c2_state === 'NOMINAL' ? 'ok' : n.c2_state === 'DEGRADED' ? 'warn' : 'bad')}>
          C2 {n.c2_state}
        </span>
      </div>
    </div>
  );
}

function Stat({ k, v, hot }) {
  return (
    <div className="nation-stat">
      <span className="k">{k}</span>
      <span className={'v' + (v === 0 ? ' dim' : '') + (hot ? ' ' : '')} style={hot ? { color:'var(--hostile-2)' } : {}}>
        {formatNum(v ?? 0)}
      </span>
    </div>
  );
}

function NationFlag({ code }) {
  // Tiny schematic flag bars — not accurate, just recognizable zones.
  const styles = {
    usa: { bands: ['#b8514a','#d8dde4','#4a7ab8'] },
    rus: { bands: ['#d8dde4','#4a7ab8','#b8514a'], horizontal: true },
    chn: { bands: ['#b8514a'] },
    gbr: { bands: ['#4a7ab8','#d8dde4','#b8514a'] },
    fra: { bands: ['#4a7ab8','#d8dde4','#b8514a'] },
    prk: { bands: ['#4a7ab8','#b8514a','#4a7ab8'], horizontal: true },
    ind: { bands: ['#c47a3a','#d8dde4','#5a9a6a'], horizontal: true },
    pak: { bands: ['#d8dde4','#5a9a6a'] },
    isr: { bands: ['#d8dde4','#4a7ab8','#d8dde4'], horizontal: true },
    irn: { bands: ['#5a9a6a','#d8dde4','#b8514a'], horizontal: true },
  };
  const s = styles[code] || { bands: ['#5a6471'] };
  return (
    <div style={{
      width:'100%', height:'100%',
      display:'flex',
      flexDirection: s.horizontal ? 'column' : 'row'
    }}>
      {s.bands.map((b, i) => (
        <div key={i} style={{ background: b, flex:1 }}/>
      ))}
    </div>
  );
}

// ---- Right rail: inspector / watchlist ----
function RightRail({ sel, entitiesById, citiesById, detonations, watchlist, onOpenInspector, onAddWatch, onRemoveWatch }) {
  const [tab, setTab] = useS('inspect');
  return (
    <div className="panel rail-r">
      <div className="tabs">
        <button className={tab==='inspect'?'active':''} onClick={()=>setTab('inspect')}>Inspect</button>
        <button className={tab==='watch'?'active':''} onClick={()=>setTab('watch')}>
          Watch <span style={{ color:'var(--text-4)', marginLeft:4 }}>{watchlist.length}</span>
        </button>
      </div>
      {tab === 'inspect' && (
        <InspectorPanel sel={sel} entitiesById={entitiesById} citiesById={citiesById}
          detonations={detonations}
          onAddWatch={onAddWatch}
          onExpand={onOpenInspector}/>
      )}
      {tab === 'watch' && (
        <WatchPanel watchlist={watchlist} entitiesById={entitiesById}
          onRemove={onRemoveWatch}
          onSelect={(id)=>onOpenInspector(id)}/>
      )}
    </div>
  );
}

function InspectorPanel({ sel, entitiesById, citiesById, detonations, onAddWatch, onExpand }) {
  if (!sel) {
    return (
      <div className="panel-body">
        <div className="inspector-empty">
          <div className="mark"/>
          NO ENTITY SELECTED
          <div style={{ marginTop: 10, color:'var(--text-4)', fontSize: 10, letterSpacing:'0.1em' }}>
            CLICK ANY TRACK ON THE GLOBE<br/>TO OPEN INSPECTOR
          </div>
        </div>
      </div>
    );
  }
  if (sel.startsWith('city:')) {
    const c = citiesById[sel.slice(5)];
    if (!c) return null;
    const det = detonations.find(d => d.target_city === c.id);
    return <CityInspector c={c} det={det}/>;
  }
  const e = entitiesById[sel];
  if (!e) return <div className="inspector-empty">ENTITY NOT FOUND</div>;
  return <EntityInspector e={e} onAddWatch={onAddWatch} onExpand={onExpand}/>;
}

function EntityInspector({ e, onAddWatch, onExpand }) {
  const c = window.NATO.colorFor(e.side);
  const iconHtml = window.NATO.renderIcon({ cls: e.cls, side: e.side, size: 36, state: e.state });
  return (
    <div className="panel-body">
      <div style={{
        display:'grid',
        gridTemplateColumns:'52px 1fr',
        gap:'10px',
        padding:'12px',
        borderBottom:'1px solid var(--line-0)',
        alignItems:'center'
      }}>
        <div dangerouslySetInnerHTML={{ __html: iconHtml }}/>
        <div>
          <div style={{ color:'var(--text-0)', fontSize: 12, letterSpacing:'0.08em', fontWeight: 600 }}>
            {e.name || e.sub}
          </div>
          <div style={{ color: c.stroke, fontSize: 10, letterSpacing:'0.1em', textTransform:'uppercase', marginTop: 2 }}>
            {e.cls.replace(/_/g,' ')} · {e.side.toUpperCase()}
          </div>
          <div style={{ color:'var(--text-3)', fontSize: 10, marginTop: 2, fontVariantNumeric:'tabular-nums' }}>
            ID {e.id}
          </div>
        </div>
      </div>

      <div className="kv-grid">
        <span className="k">Class</span><span className="v">{e.cls}</span>
        <span className="k">Sub</span><span className="v">{e.sub}</span>
        <span className="k">State</span><span className="v">{e.state || '—'}</span>
        <span className="k">Position</span>
        <span className="v mono">{fmtLat(e.pos[0])} / {fmtLon(e.pos[1])}</span>
        <span className="k">Altitude</span>
        <span className="v mono">{formatAlt(e.pos[2])}</span>
        {e.hp != null && <>
          <span className="k">Integrity</span>
          <span className="v">{(e.hp*100).toFixed(0)}%
            <div className="bar ok" style={{ marginTop: 3 }}><span style={{ width:(e.hp*100)+'%' }}/></div>
          </span>
        </>}
        {e.fuel != null && <>
          <span className="k">Fuel</span>
          <span className="v">{(e.fuel*100).toFixed(0)}%
            <div className="bar friendly" style={{ marginTop: 3 }}><span style={{ width:(e.fuel*100)+'%' }}/></div>
          </span>
        </>}
      </div>

      {/* Missile-specific */}
      {['icbm','slbm','mrbm','srbm','cruise_alcm','cruise_slcm','cruise_glcm','abm_interceptor','sam_interceptor'].includes(e.cls) && (
        <div className="sec">
          <div className="sec-hdr">Flight</div>
          <div className="kv-grid">
            {e.apogee_m != null && <><span className="k">Apogee</span><span className="v mono">{(e.apogee_m/1000).toFixed(0)} km</span></>}
            {e.impact_eta_s != null && <><span className="k">Impact ETA</span><span className="v mono">T+{fmtDur(e.impact_eta_s)}</span></>}
            {e.warheads_count != null && <><span className="k">Warheads</span><span className="v">{e.warheads_count}{e.is_mirv ? ' MIRV' : ''}</span></>}
            {e.origin && <><span className="k">Origin</span><span className="v mono">{fmtLat(e.origin[0])} / {fmtLon(e.origin[1])}</span></>}
            {e.destination && <><span className="k">Target</span><span className="v mono">{fmtLat(e.destination[0])} / {fmtLon(e.destination[1])}</span></>}
            {e.intercepting && <><span className="k">Vs Target</span><span className="v" style={{ color:'var(--warn)' }}>{e.intercepting}</span></>}
          </div>
        </div>
      )}

      {/* Aircraft-specific */}
      {['fighter','bomber','awacs','tanker','elint','combat_uav','recon_uav'].includes(e.cls) && (
        <div className="sec">
          <div className="sec-hdr">Platform</div>
          <div className="kv-grid">
            {e.callsign && <><span className="k">Callsign</span><span className="v">{e.callsign}</span></>}
            {e.radar_on != null && <><span className="k">Radar</span><span className="v">{e.radar_on ? 'ACTIVE' : 'SILENT'}</span></>}
            {e.stealth_rcs_m2 != null && <><span className="k">RCS</span><span className="v mono">{e.stealth_rcs_m2} m²</span></>}
          </div>
          {e.weapons && <>
            <div className="sec-hdr" style={{ marginTop: 4 }}>Weapons</div>
            <div style={{ padding: '0 12px 12px', fontSize: 11 }}>
              {e.weapons.map((w, i) => (
                <div key={i} className="row" style={{ justifyContent:'space-between', padding: '3px 0', borderBottom: '1px dashed var(--line-0)' }}>
                  <span style={{ color:'var(--text-0)' }}>{w.sub}</span>
                  <span className="mono dim">×{w.qty}</span>
                </div>
              ))}
            </div>
          </>}
        </div>
      )}

      {/* Ship/Sub */}
      {['carrier','destroyer','cruiser','frigate','ssbn','ssn','ssk'].includes(e.cls) && (
        <div className="sec">
          <div className="sec-hdr">Vessel</div>
          <div className="kv-grid">
            {e.callsign && <><span className="k">Callsign</span><span className="v">{e.callsign}</span></>}
            {e.class_tonnage_t != null && <><span className="k">Tonnage</span><span className="v mono">{formatNum(e.class_tonnage_t)} t</span></>}
            {e.depth_m != null && <><span className="k">Depth</span><span className="v mono">{e.depth_m} m</span></>}
            {e.vls_cells && <><span className="k">VLS</span>
              <span className="v mono">{Object.values(e.vls_cells.loaded||{}).reduce((a,b)=>a+b,0)} / {e.vls_cells.total}</span></>}
          </div>
          {e.vls_cells && e.vls_cells.loaded && (
            <div style={{ padding: '0 12px 12px', fontSize: 11 }}>
              {Object.entries(e.vls_cells.loaded).map(([k,v]) => (
                <div key={k} className="row" style={{ justifyContent:'space-between', padding:'3px 0', borderBottom:'1px dashed var(--line-0)' }}>
                  <span style={{ color:'var(--text-0)' }}>{k}</span>
                  <span className="mono dim">×{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ground */}
      {['silo','tel','sam_site','abm_site','radar_site'].includes(e.cls) && (
        <div className="sec">
          <div className="sec-hdr">Installation</div>
          <div className="kv-grid">
            {e.hardening_psi != null && <><span className="k">Hardening</span><span className="v mono">{formatNum(e.hardening_psi)} psi</span></>}
            {e.mobile != null && <><span className="k">Mobile</span><span className="v">{e.mobile ? 'YES' : 'NO'}</span></>}
            {e.radar_range_km != null && <><span className="k">Radar Range</span><span className="v mono">{formatNum(e.radar_range_km)} km</span></>}
          </div>
        </div>
      )}

      <div style={{ padding: '10px 12px', display:'flex', gap: 6, borderTop:'1px solid var(--line-0)' }}>
        <button className="btn sm" onClick={()=>onAddWatch(e.id)}>+ Watchlist</button>
        <button className="btn sm" onClick={()=>onExpand(e.id)}>Full Inspect ↗</button>
      </div>
    </div>
  );
}

function CityInspector({ c, det }) {
  const struck = !!det;
  return (
    <div className="panel-body">
      <div style={{ padding: 12, borderBottom:'1px solid var(--line-0)' }}>
        <div style={{ color:'var(--text-0)', fontSize: 13, fontWeight: 600, letterSpacing:'0.06em' }}>{c.name.toUpperCase()}</div>
        <div style={{ color:'var(--text-3)', fontSize: 10, letterSpacing:'0.1em', textTransform:'uppercase', marginTop: 2 }}>
          {c.is_capital ? 'Capital · ' : ''}{c.country.toUpperCase()}
          {c.is_counterforce_adjacent && <span style={{ color:'var(--warn)' }}> · COUNTERFORCE-ADJ</span>}
        </div>
      </div>
      <div className="kv-grid">
        <span className="k">Population</span><span className="v mono">{formatNum(c.population_total)}</span>
        <span className="k">Position</span><span className="v mono">{fmtLat(c.pos[0])} / {fmtLon(c.pos[1])}</span>
      </div>
      {struck && (
        <div className="sec" style={{ borderTop:'1px solid var(--hostile)' }}>
          <div className="sec-hdr" style={{ color:'var(--hostile-2)' }}>⚠ STRUCK</div>
          <div className="kv-grid">
            <span className="k">Yield</span><span className="v mono">{det.yield_kt} kT</span>
            <span className="k">Fuse</span><span className="v">{det.fuse}{det.hob_m ? ` · HOB ${det.hob_m}m` : ''}</span>
            <span className="k">ψ5</span><span className="v mono">{det.psi5_radius_km} km</span>
            <span className="k">ψ20</span><span className="v mono">{det.psi20_radius_km} km</span>
            <span className="k">Thermal 3°</span><span className="v mono">{det.thermal_3rd_deg_radius_km} km</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WatchPanel({ watchlist, entitiesById, onSelect, onRemove }) {
  if (!watchlist.length) {
    return (
      <div className="panel-body">
        <div className="inspector-empty">
          <div className="mark"/>
          WATCHLIST EMPTY
          <div style={{ marginTop: 10, color:'var(--text-4)', fontSize: 10, letterSpacing:'0.1em' }}>
            ADD ENTITIES FROM INSPECTOR<br/>TO SUBSCRIBE AT 30Hz
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="panel-body">
      {watchlist.map(id => {
        const e = entitiesById[id];
        if (!e) return null;
        return (
          <div key={id} className="watch-row" onClick={()=>onSelect(id)}>
            <div dangerouslySetInnerHTML={{ __html: window.NATO.renderIcon({ cls: e.cls, side: e.side, size: 18 }) }}/>
            <div>
              <div style={{ color:'var(--text-0)' }}>{e.name || e.sub}</div>
              <div className="sub">{e.cls.toUpperCase()} · {e.sub}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap: 2 }}>
              <div className="state">30Hz</div>
              <button className="btn sm ghost" style={{ fontSize: 9, padding:'1px 4px' }}
                onClick={(ev)=>{ ev.stopPropagation(); onRemove(id); }}>×</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Event log ----
function EventLog({ events, playheadT, filters, onToggleFilter, onEventClick }) {
  const bodyRef = useR(null);
  const visible = events.filter(e => filters[e.kind] !== false && e.t <= playheadT);
  useE(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [visible.length]);

  const kinds = ['launch','detect','track','engage','intercept_hit','intercept_miss','detonation','c2_link_lost','casualty_update'];
  return (
    <div className="log">
      <div className="log-hdr">
        <span>Event Log</span>
        <div className="log-filters">
          {kinds.map(k => (
            <button key={k}
              className={'tchip ' + (filters[k] === false ? 'off' : 'on')}
              onClick={()=>onToggleFilter(k)}>
              {k.replace(/_/g,' ')}
            </button>
          ))}
        </div>
        <span style={{ color:'var(--text-3)', fontSize: 10 }}>{visible.length} / {events.length}</span>
      </div>
      <div className="log-body" ref={bodyRef}>
        {visible.map((e, i) => (
          <div key={i} className="log-row" onClick={()=>onEventClick && onEventClick(e)}>
            <span className="t">T+{fmtDur(e.t)}</span>
            <span className={'kind ' + e.kind}>{e.kind.replace(/_/g,' ')}</span>
            <span className="msg" dangerouslySetInnerHTML={{ __html: e.msg }}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Controls ----
function Controls({ playheadT, maxT, playing, timeScale, onPlay, onPause, onStep, onScrub, onScale, events, onOpenLaunchModal, onOpenShipModal, onOpenAircraftModal, onSaveState }) {
  const marks = events.filter(e => ['detonation','launch'].includes(e.kind));
  return (
    <div className="controls">
      <div className="controls-row">
        <span className="lbl">Sim</span>
        <button className={'btn sm ' + (!playing ? 'active' : '')} onClick={onPause}>❚❚ Pause</button>
        <button className={'btn sm ' + (playing ? 'active' : '')} onClick={onPlay}>▶ Resume</button>
        <button className="btn sm ghost" onClick={onStep}>▸❚ Step</button>
        <div className="sep"/>
        <span className="lbl">Rate</span>
        <div className="time-scale">
          <input type="range" min="0.1" max="100" step="0.1" value={timeScale}
            onChange={(e)=>onScale(parseFloat(e.target.value))}/>
          <span className="v">{timeScale.toFixed(1)}×</span>
        </div>
      </div>
      <div className="controls-row">
        <span className="lbl">Replay</span>
        <div className="scrubber">
          <span className="t" style={{ textAlign:'left' }}>T+{fmtDur(0)}</span>
          <div className="track" onClick={(e)=>{
            const r = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - r.left) / r.width;
            onScrub(Math.max(0, Math.min(1, pct)) * maxT);
          }}>
            <div className="fill" style={{ width: (playheadT/maxT*100) + '%' }}/>
            {marks.map((m, i) => (
              <div key={i}
                className={'event-mark ' + (m.kind === 'detonation' ? 'det' : 'lau')}
                style={{ left: (m.t/maxT*100) + '%' }}
                title={m.kind + ' @ T+' + fmtDur(m.t)}
              />
            ))}
            <div className="thumb" style={{ left: (playheadT/maxT*100) + '%' }}/>
          </div>
          <span className="t">T+{fmtDur(playheadT)}</span>
        </div>
      </div>
      <div className="controls-row" style={{ marginTop: 'auto', background: 'var(--bg-1)' }}>
        <span className="lbl">Orders</span>
        <button className="btn primary" onClick={onOpenLaunchModal}>⎈ LAUNCH ORDER</button>
        <button className="btn sm" onClick={onOpenShipModal}>Ship Order</button>
        <button className="btn sm" onClick={onOpenAircraftModal}>Aircraft Order</button>
        <button className="btn sm ghost" style={{ marginLeft:'auto' }} onClick={onSaveState}>Save State</button>
      </div>
    </div>
  );
}

// ---- Launch Order Modal ----
function LaunchOrderModal({ nations, targets, onClose, onSubmit }) {
  const [nation, setNation] = useS('usa');
  const [pkg, setPkg] = useS('counterforce');
  const [selTargets, setSelTargets] = useS({});
  const [weapons, setWeapons] = useS('auto');

  const packages = [
    { id:'minimum_deterrent', title:'Minimum Deterrent', desc:'Single retaliatory strike · 5–10 warheads · capitals only' },
    { id:'counterforce',      title:'Counterforce',      desc:'Military targets only · silos, TELs, ABM sites, C2 nodes' },
    { id:'countervalue',      title:'Countervalue',      desc:'Population/industry · high-yield on cities · MAD doctrine' },
    { id:'decap',             title:'Decapitation',      desc:'Leadership & C2 nodes · low-yield airburst · NC3' },
    { id:'custom',            title:'Custom',            desc:'Specify targets and weapon assignment manually' },
  ];

  const filteredTargets = targets.filter(t => {
    if (pkg === 'counterforce') return t.kind === 'entity';
    if (pkg === 'countervalue' || pkg === 'minimum_deterrent') return t.kind === 'city';
    if (pkg === 'decap') return t.kind === 'entity' || (t.kind==='city' && /capital/i.test(t.label) === false);
    return true;
  });

  const count = Object.values(selTargets).filter(Boolean).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-hdr">
          <h2>
            <span className="classification">TOP SECRET // NOFORN</span>
            LAUNCH ORDER — NEW
          </h2>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Left column: nation + package */}
          <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
            <div className="form-sec">
              <h3><span>01 · Launching Nation</span></h3>
              <select className="inp" value={nation} onChange={e=>setNation(e.target.value)}>
                {nations.filter(n=>n.side==='blue').map(n => (
                  <option key={n.code} value={n.code}>{n.code.toUpperCase()} — {n.name}</option>
                ))}
              </select>
              <div style={{ marginTop: 8, fontSize: 10, color:'var(--text-3)', letterSpacing:'0.05em', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 4 }}>
                <span>ICBM available: <strong style={{ color:'var(--text-0)' }}>{nations.find(n=>n.code===nation)?.icbm_remaining}</strong></span>
                <span>SLBM available: <strong style={{ color:'var(--text-0)' }}>{nations.find(n=>n.code===nation)?.slbm_remaining}</strong></span>
              </div>
            </div>

            <div className="form-sec">
              <h3><span>02 · Strike Package</span></h3>
              <div className="radio-list">
                {packages.map(p => (
                  <label key={p.id} className={pkg === p.id ? 'checked' : ''}>
                    <input type="radio" name="pkg" checked={pkg === p.id} onChange={()=>setPkg(p.id)}/>
                    <div>
                      <div className="title">{p.title}</div>
                      <div className="desc">{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-sec">
              <h3><span>03 · Weapon Assignment</span></h3>
              <div className="radio-list">
                <label className={weapons==='auto'?'checked':''}>
                  <input type="radio" name="wep" checked={weapons==='auto'} onChange={()=>setWeapons('auto')}/>
                  <div>
                    <div className="title">Auto-assign (SIOP)</div>
                    <div className="desc">Backend chooses W-number & platform by target type</div>
                  </div>
                </label>
                <label className={weapons==='manual'?'checked':''}>
                  <input type="radio" name="wep" checked={weapons==='manual'} onChange={()=>setWeapons('manual')}/>
                  <div>
                    <div className="title">Manual</div>
                    <div className="desc">Specify sub, quantity per target</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right column: targets */}
          <div className="form-sec" style={{ display:'flex', flexDirection:'column' }}>
            <h3>
              <span>04 · Targets</span>
              <span className="num">{count} selected · {filteredTargets.length} available</span>
            </h3>
            <div style={{ overflow:'auto', maxHeight: 360 }}>
              {filteredTargets.map(t => (
                <div key={t.id} className="target-row">
                  <input type="checkbox" checked={!!selTargets[t.id]}
                    onChange={e=>setSelTargets({...selTargets, [t.id]: e.target.checked})}/>
                  <div>
                    <div className="name">{t.label}</div>
                    <div className="loc mono">{fmtLat(t.lat)} / {fmtLon(t.lon)} · {t.country.toUpperCase()}</div>
                  </div>
                  {t.pop != null && <span className="pop">{formatNum(t.pop)}</span>}
                  <span className="chip" style={{ borderColor: t.kind === 'city' ? 'var(--hostile)' : 'var(--warn)', color: t.kind === 'city' ? 'var(--hostile-2)' : 'var(--warn)' }}>
                    {t.kind === 'city' ? 'CITY' : 'MIL'}
                  </span>
                  {weapons === 'manual' && (
                    <input className="inp mono" style={{ width: 48, padding:'2px 6px' }} defaultValue="1"/>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-ftr">
          <div style={{ color:'var(--text-3)', fontSize: 10.5, letterSpacing:'0.05em' }}>
            {count > 0 ? <>
              SUMMARY: <strong style={{ color:'var(--text-0)' }}>{nation.toUpperCase()}</strong> ·{' '}
              <strong style={{ color:'var(--text-0)' }}>{pkg.toUpperCase()}</strong> ·{' '}
              <strong style={{ color:'var(--hostile-2)' }}>{count} TARGET{count>1?'S':''}</strong> ·{' '}
              WEAPONS <strong style={{ color:'var(--text-0)' }}>{weapons.toUpperCase()}</strong>
            </> : <>SELECT AT LEAST ONE TARGET TO PROCEED</>}
          </div>
          <div style={{ display:'flex', gap: 6 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={count === 0}
              onClick={()=>onSubmit({ nation, strike_package: pkg, targets: selTargets, weapons })}
              style={{ opacity: count === 0 ? 0.4 : 1 }}>
              ⎈ Authorize & Transmit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Inspector Modal (full inspection) ----
function FullInspectorModal({ id, entitiesById, citiesById, detonations, onClose }) {
  if (!id) return null;
  const e = entitiesById[id];
  if (!e) return null;
  const history = Array.from({ length: 24 }, (_, i) => {
    const t = -23 + i;
    return { t, lat: e.pos[0] + (Math.random()-0.5)*0.5, lon: e.pos[1] + (Math.random()-0.5)*0.5, alt: (e.pos[2] || 0) * (0.5 + Math.random()*0.5) };
  });
  const c = window.NATO.colorFor(e.side);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width:'min(1100px, 94vw)' }} onClick={ev=>ev.stopPropagation()}>
        <div className="modal-hdr">
          <h2>
            <span dangerouslySetInnerHTML={{ __html: window.NATO.renderIcon({ cls: e.cls, side: e.side, size: 20 }) }}/>
            INSPECT · {e.name || e.sub}
            <span style={{ color:'var(--text-3)', fontWeight:400, letterSpacing:'0.05em' }}>{e.id}</span>
          </h2>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ gridTemplateColumns:'1fr 1fr 1fr', gap: 12 }}>
          <div className="form-sec">
            <h3><span>Header</span></h3>
            <div className="kv-grid" style={{ padding:0, gridTemplateColumns:'90px 1fr' }}>
              <span className="k">Class</span><span className="v">{e.cls}</span>
              <span className="k">Sub</span><span className="v">{e.sub}</span>
              <span className="k">Side</span><span className="v" style={{ color: c.stroke }}>{e.side.toUpperCase()}</span>
              <span className="k">State</span><span className="v">{e.state}</span>
              <span className="k">HP</span><span className="v mono">{(e.hp*100).toFixed(0)}%</span>
              {e.fuel!=null && <><span className="k">Fuel</span><span className="v mono">{(e.fuel*100).toFixed(0)}%</span></>}
              <span className="k">Lat</span><span className="v mono">{fmtLat(e.pos[0])}</span>
              <span className="k">Lon</span><span className="v mono">{fmtLon(e.pos[1])}</span>
              <span className="k">Alt</span><span className="v mono">{formatAlt(e.pos[2])}</span>
            </div>
          </div>
          <div className="form-sec">
            <h3><span>Catalog ↗ sim/catalog.py</span></h3>
            <pre style={{ margin:0, fontSize: 10, color:'var(--text-1)', whiteSpace:'pre-wrap', lineHeight:1.5 }}>
{JSON.stringify(catalogMock(e), null, 2)}
            </pre>
          </div>
          <div className="form-sec">
            <h3><span>Relations</span></h3>
            <div style={{ fontSize: 11, color:'var(--text-2)' }}>
              <div style={{ padding:'4px 0' }}>Parent: <strong style={{ color: 'var(--text-0)' }}>{e.parent || '—'}</strong></div>
              <div style={{ padding:'4px 0' }}>Children: <strong style={{ color: 'var(--text-0)' }}>{e.children ? e.children.length : 0}</strong></div>
              <div style={{ padding:'4px 0' }}>Tracked by:{' '}
                <strong style={{ color: 'var(--friendly-2)' }}>
                  {['LEKHTUSI','CLEAR AFS','FYLINGDALES'].slice(0, 2).join(', ')}
                </strong>
              </div>
            </div>
            <h3 style={{ marginTop: 10 }}><span>History (pos · last 5m)</span></h3>
            <HistorySparkline history={history} color={c.stroke}/>
          </div>
        </div>
        <div className="modal-ftr">
          <div style={{ color:'var(--text-3)', fontSize: 10 }}>Subscribed 30Hz · lastTick T+780s</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function catalogMock(e) {
  return {
    model: e.sub,
    manufacturer: e.side === 'usa' ? 'NORTHROP GRUMMAN' : e.side === 'rus' ? 'MIT' : 'CASIC',
    ioc: 1998 + (e.cls.charCodeAt(0) % 20),
    yield_kt: e.cls.startsWith('icbm') || e.cls.startsWith('slbm') ? [300, 455, 800][e.cls.length % 3] : null,
    range_km: ['icbm','slbm'].includes(e.cls) ? 11000 : e.cls.startsWith('cruise') ? 2500 : 800,
    rcs_m2: e.stealth_rcs_m2 || 0.8,
  };
}

function HistorySparkline({ history, color }) {
  const w = 240, h = 50;
  const xs = history.map((_, i) => i / (history.length-1) * w);
  const alts = history.map(p => p.alt || 0);
  const maxA = Math.max(1, ...alts);
  const pts = history.map((p, i) => [xs[i], h - (p.alt/maxA)*h*0.9]);
  const d = 'M' + pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L');
  return (
    <svg width={w} height={h} style={{ marginTop: 6, background: 'var(--bg-0)', border: '1px solid var(--line-0)' }}>
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={0} x2={w} y1={h*p} y2={h*p} stroke="var(--line-0)" strokeDasharray="2 3"/>
      ))}
      <path d={d} fill="none" stroke={color} strokeWidth="1"/>
    </svg>
  );
}

// ---- Formatting ----
function formatNum(n) {
  if (n == null) return '—';
  if (n >= 1000000) return (n/1000000).toFixed(n > 10000000 ? 0 : 1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(n > 10000 ? 0 : 1) + 'k';
  return n.toLocaleString();
}
function formatAlt(m) {
  if (m == null) return '—';
  if (m === 0) return 'SURF';
  if (m < 0) return m + ' m SUB';
  if (m >= 1000000) return (m/1000000).toFixed(2) + ' Mm';
  if (m >= 1000) return (m/1000).toFixed(1) + ' km';
  return m.toFixed(0) + ' m';
}
function fmtLat(v) {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = (a - d) * 60;
  return `${d.toString().padStart(2,'0')}°${m.toFixed(2).padStart(5,'0')}' ${v>=0?'N':'S'}`;
}
function fmtLon(v) {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = (a - d) * 60;
  return `${d.toString().padStart(3,'0')}°${m.toFixed(2).padStart(5,'0')}' ${v>=0?'E':'W'}`;
}
function fmtDur(s) {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const ss = s%60;
  if (h > 0) return `${h}h${m.toString().padStart(2,'0')}m${ss.toString().padStart(2,'0')}s`;
  return `${m.toString().padStart(2,'0')}m${ss.toString().padStart(2,'0')}s`;
}

// ---- Ship Order Modal ----
function ShipOrderModal({ ships, onClose, onSubmit }) {
  const [shipId, setShipId] = useS(ships[0]?.id || '');
  const [order, setOrder] = useS('station');
  const [lat, setLat] = useS('36.0');
  const [lon, setLon] = useS('-15.2');
  const [speed, setSpeed] = useS('24');
  const orders = [
    { id:'transit',  title:'Transit',  desc:'Proceed to waypoint at specified speed' },
    { id:'station',  title:'Station',  desc:'Hold position · maintain watch' },
    { id:'strike',   title:'Strike',   desc:'Launch VLS payload against target' },
    { id:'rtb',      title:'RTB',      desc:'Return to homeport for replenishment' },
  ];
  const ship = ships.find(s => s.id === shipId);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width:'min(620px,92vw)' }} onClick={e=>e.stopPropagation()}>
        <div className="modal-hdr">
          <h2>
            <span className="classification">SECRET // REL 5EYES</span>
            SHIP ORDER — NEW
          </h2>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ gridTemplateColumns:'1fr' }}>
          <div className="form-sec">
            <h3><span>01 · Vessel</span></h3>
            <select className="inp" value={shipId} onChange={e=>setShipId(e.target.value)}>
              {ships.map(s => (
                <option key={s.id} value={s.id}>{(s.name || s.sub)} · {s.callsign || s.id} · {s.side.toUpperCase()}</option>
              ))}
            </select>
            {ship && (
              <div style={{ marginTop:8, fontSize:10, color:'var(--text-3)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
                <span>Class <strong style={{ color:'var(--text-0)' }}>{ship.sub}</strong></span>
                <span>Pos <strong className="mono" style={{ color:'var(--text-0)' }}>{fmtLat(ship.pos[0])}</strong></span>
                <span>HP <strong style={{ color:'var(--text-0)' }}>{((ship.hp||1)*100).toFixed(0)}%</strong></span>
              </div>
            )}
          </div>
          <div className="form-sec">
            <h3><span>02 · Order</span></h3>
            <div className="radio-list">
              {orders.map(o => (
                <label key={o.id} className={order===o.id?'checked':''}>
                  <input type="radio" name="so" checked={order===o.id} onChange={()=>setOrder(o.id)}/>
                  <div>
                    <div className="title">{o.title}</div>
                    <div className="desc">{o.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {(order === 'transit' || order === 'strike') && (
            <div className="form-sec">
              <h3><span>03 · Params</span></h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <label style={{ display:'flex',flexDirection:'column',gap:4,fontSize:10,color:'var(--text-3)',letterSpacing:'0.08em',textTransform:'uppercase' }}>
                  Waypoint Lat<input className="inp mono" value={lat} onChange={e=>setLat(e.target.value)}/>
                </label>
                <label style={{ display:'flex',flexDirection:'column',gap:4,fontSize:10,color:'var(--text-3)',letterSpacing:'0.08em',textTransform:'uppercase' }}>
                  Waypoint Lon<input className="inp mono" value={lon} onChange={e=>setLon(e.target.value)}/>
                </label>
                <label style={{ display:'flex',flexDirection:'column',gap:4,fontSize:10,color:'var(--text-3)',letterSpacing:'0.08em',textTransform:'uppercase' }}>
                  Speed (kt)<input className="inp mono" value={speed} onChange={e=>setSpeed(e.target.value)}/>
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="modal-ftr">
          <div style={{ color:'var(--text-3)', fontSize:10.5, letterSpacing:'0.05em' }}>
            {ship ? <>SUMMARY: <strong style={{ color:'var(--text-0)' }}>{ship.name || ship.sub}</strong> · <strong style={{ color:'var(--text-0)' }}>{order.toUpperCase()}</strong>{(order==='transit'||order==='strike') ? <> · WP <span className="mono">{lat},{lon}</span></> : null}</> : 'SELECT VESSEL'}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={!ship}
              onClick={()=>onSubmit({ cmd:'ship_order', ship_id:shipId, order, params:(order==='transit'||order==='strike')?{ waypoint:[parseFloat(lat),parseFloat(lon)], speed_kt:parseFloat(speed) }:{} })}>
              ⎈ Transmit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Aircraft Order Modal ----
function AircraftOrderModal({ aircraft, onClose, onSubmit }) {
  const [acId, setAcId] = useS(aircraft[0]?.id || '');
  const [order, setOrder] = useS('cap');
  const [station, setStation] = useS('52.0,-10.0');
  const [alt, setAlt] = useS('9200');
  const [weapons, setWeapons] = useS({});
  const orders = [
    { id:'cap',     title:'Combat Air Patrol', desc:'Loiter on station · engage hostile tracks · weapons free' },
    { id:'strike',  title:'Strike',            desc:'Proceed to target · release ordnance · RTB' },
    { id:'patrol',  title:'Patrol',            desc:'Route patrol · sensor watch · weapons tight' },
    { id:'rtb',     title:'RTB',               desc:'Abort current tasking · return to base' },
  ];
  const ac = aircraft.find(a => a.id === acId);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width:'min(620px,92vw)' }} onClick={e=>e.stopPropagation()}>
        <div className="modal-hdr">
          <h2>
            <span className="classification">SECRET // REL 5EYES</span>
            AIRCRAFT ORDER — NEW
          </h2>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ gridTemplateColumns:'1fr' }}>
          <div className="form-sec">
            <h3><span>01 · Aircraft</span></h3>
            <select className="inp" value={acId} onChange={e=>setAcId(e.target.value)}>
              {aircraft.map(a => (
                <option key={a.id} value={a.id}>{a.callsign || a.sub} · {a.sub} · {a.side.toUpperCase()}</option>
              ))}
            </select>
            {ac && (
              <div style={{ marginTop:8, fontSize:10, color:'var(--text-3)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
                <span>Type <strong style={{ color:'var(--text-0)' }}>{ac.cls.toUpperCase()}</strong></span>
                <span>Fuel <strong style={{ color:'var(--text-0)' }}>{((ac.fuel||1)*100).toFixed(0)}%</strong></span>
                <span>Alt <strong className="mono" style={{ color:'var(--text-0)' }}>{formatAlt(ac.pos[2])}</strong></span>
              </div>
            )}
          </div>
          <div className="form-sec">
            <h3><span>02 · Order</span></h3>
            <div className="radio-list">
              {orders.map(o => (
                <label key={o.id} className={order===o.id?'checked':''}>
                  <input type="radio" name="ao" checked={order===o.id} onChange={()=>setOrder(o.id)}/>
                  <div>
                    <div className="title">{o.title}</div>
                    <div className="desc">{o.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {order !== 'rtb' && (
            <div className="form-sec">
              <h3><span>03 · Params</span></h3>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
                <label style={{ display:'flex',flexDirection:'column',gap:4,fontSize:10,color:'var(--text-3)',letterSpacing:'0.08em',textTransform:'uppercase' }}>
                  Station (lat,lon)<input className="inp mono" value={station} onChange={e=>setStation(e.target.value)}/>
                </label>
                <label style={{ display:'flex',flexDirection:'column',gap:4,fontSize:10,color:'var(--text-3)',letterSpacing:'0.08em',textTransform:'uppercase' }}>
                  Altitude (m)<input className="inp mono" value={alt} onChange={e=>setAlt(e.target.value)}/>
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="modal-ftr">
          <div style={{ color:'var(--text-3)', fontSize:10.5, letterSpacing:'0.05em' }}>
            {ac ? <>SUMMARY: <strong style={{ color:'var(--text-0)' }}>{ac.callsign || ac.sub}</strong> · <strong style={{ color:'var(--text-0)' }}>{order.toUpperCase()}</strong>{order!=='rtb' && <> · STN <span className="mono">{station}</span> @ <span className="mono">{alt}m</span></>}</> : 'SELECT AIRCRAFT'}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={!ac}
              onClick={()=>onSubmit({ cmd:'aircraft_order', aircraft_id:acId, order, params: order!=='rtb' ? { station: station.split(',').map(parseFloat), alt_m: parseFloat(alt) } : {} })}>
              ⎈ Transmit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  NationsRail, RightRail, EventLog, Controls, LaunchOrderModal, FullInspectorModal,
  ShipOrderModal, AircraftOrderModal,
  formatNum, formatAlt, fmtLat, fmtLon, fmtDur,
});
