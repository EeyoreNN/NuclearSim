// Live WebSocket client — wires the UI to the real Python backend.
//
// Protocol: ws://localhost:8765/stream (matches FRONTEND_REQUIREMENTS.md §2)
// Frames we consume: hello, tick, event, entity_spawn, metrics, inspect, ack
// Commands we send:  pause, resume, set_time_scale, launch_order, aircraft_order,
//                    ship_order, sub_order, nation_posture, inspect
//
// Usage:
//   SimLive.connect({ url, onState, onEvents, onMetrics, onStatus })
//   SimLive.send({ cmd: 'launch_order', ... })

(function () {
  const DEFAULT_URL = 'ws://localhost:8765/stream';
  const RECONNECT_MS = 2000;

  let ws = null;
  let url = DEFAULT_URL;
  let queue = [];              // commands queued while disconnected
  let handlers = {};
  let reconnectTimer = null;
  let status = 'idle';         // idle | connecting | live | error | closed | fallback
  let lastHello = null;
  let entities = {};           // id -> entity (current snapshot)
  let cities = {};
  let nations = [];
  let eventBuffer = [];        // last N events
  let metrics = null;
  const MAX_EVENTS = 500;

  function setStatus(s, detail) {
    status = s;
    handlers.onStatus && handlers.onStatus(s, detail);
  }

  function connect(opts = {}) {
    handlers = opts;
    url = opts.url || DEFAULT_URL;
    _open();
  }

  function _open() {
    if (ws) { try { ws.close(); } catch(e){} }
    setStatus('connecting');
    try {
      ws = new WebSocket(url);
    } catch (e) {
      setStatus('error', e.message);
      _scheduleReconnect();
      return;
    }
    ws.onopen = () => {
      setStatus('live');
      // Flush any queued commands
      for (const m of queue) ws.send(JSON.stringify(m));
      queue = [];
    };
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch(e) { return; }
      _handleFrame(msg);
    };
    ws.onclose = () => {
      setStatus('closed');
      _scheduleReconnect();
    };
    ws.onerror = (e) => {
      setStatus('error');
    };
  }

  function _scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      _open();
    }, RECONNECT_MS);
  }

  function _handleFrame(msg) {
    const { type, t, seq, payload } = msg;
    if (type === 'hello') {
      lastHello = payload;
      entities = {};
      cities = {};
      nations = (payload.nations || []).slice();
      for (const e of (payload.entities || [])) entities[e.id] = e;
      for (const c of (payload.cities || [])) cities[c.id] = c;
      handlers.onState && handlers.onState({
        kind:'hello', t, entities, cities, nations, hello: payload,
      });
    } else if (type === 'tick') {
      const updates = payload.updates || [];
      const removed = payload.removed || [];
      for (const u of updates) {
        const cur = entities[u.id];
        if (cur) Object.assign(cur, u);
        else entities[u.id] = u;
      }
      for (const id of removed) delete entities[id];
      handlers.onState && handlers.onState({ kind:'tick', t, entities, removed });
    } else if (type === 'entity_spawn') {
      entities[payload.id] = payload;
      handlers.onState && handlers.onState({ kind:'spawn', t, entities });
    } else if (type === 'event') {
      const evt = { t, ...payload };
      eventBuffer.push(evt);
      if (eventBuffer.length > MAX_EVENTS) eventBuffer.shift();
      handlers.onEvents && handlers.onEvents(eventBuffer.slice());
    } else if (type === 'metrics') {
      metrics = payload;
      handlers.onMetrics && handlers.onMetrics(payload, t);
    } else if (type === 'inspect') {
      handlers.onInspect && handlers.onInspect(payload);
    } else if (type === 'ack') {
      handlers.onAck && handlers.onAck(payload);
    }
  }

  function send(cmd) {
    const msg = typeof cmd === 'string' ? { cmd } : cmd;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
    } else {
      queue.push(msg);
    }
  }

  function disconnect() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (ws) { try { ws.close(); } catch(e){} ws = null; }
    // Deliberate disconnect → drop any queued commands; reconnect starts fresh.
    queue.length = 0;
    setStatus('idle');
  }

  function snapshot() {
    return {
      status, url,
      entities: Object.values(entities),
      cities: Object.values(cities),
      nations, events: eventBuffer.slice(), metrics, hello: lastHello,
    };
  }

  window.SimLive = { connect, send, disconnect, snapshot, get status() { return status; } };
})();
