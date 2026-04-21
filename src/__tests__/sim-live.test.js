import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../sim-live.js';

// Controllable WebSocket double — last constructed instance is exposed globally.
class MockWS {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
    MockWS.last = this;
  }
  send(data) { this.sent.push(data); }
  close() {
    this.readyState = 3;
    this.onclose && this.onclose({ code: 1000 });
  }
  _open() {
    this.readyState = 1;
    this.onopen && this.onopen({});
  }
  _recv(obj) {
    this.onmessage && this.onmessage({ data: JSON.stringify(obj) });
  }
}

let originalWS;
beforeEach(() => {
  originalWS = globalThis.WebSocket;
  globalThis.WebSocket = MockWS;
  window.SimLive.disconnect();
  MockWS.last = null;
});
afterEach(() => {
  window.SimLive.disconnect();
  globalThis.WebSocket = originalWS;
});

function connect(handlers = {}) {
  window.SimLive.connect({ url: 'ws://test/stream', ...handlers });
  return MockWS.last;
}

describe('SimLive.connect: lifecycle', () => {
  it('creates a WebSocket to the given URL', () => {
    const ws = connect();
    expect(ws).toBeInstanceOf(MockWS);
    expect(ws.url).toBe('ws://test/stream');
  });

  it('reports idle before connect', () => {
    expect(window.SimLive.status).toBe('idle');
  });

  it('reports "connecting" immediately after connect', () => {
    const statuses = [];
    connect({ onStatus: s => statuses.push(s) });
    expect(statuses[0]).toBe('connecting');
  });

  it('flips to "live" on open', () => {
    const statuses = [];
    const ws = connect({ onStatus: s => statuses.push(s) });
    ws._open();
    expect(statuses).toContain('live');
    expect(window.SimLive.status).toBe('live');
  });

  it('emits "closed" after close()', () => {
    const statuses = [];
    const ws = connect({ onStatus: s => statuses.push(s) });
    ws._open();
    ws.close();
    expect(statuses).toContain('closed');
  });
});

describe('SimLive.send: command dispatch', () => {
  it('queues commands while not yet open', () => {
    const ws = connect();
    window.SimLive.send({ cmd: 'pause' });
    expect(ws.sent).toEqual([]);
  });

  it('flushes queued commands on open', () => {
    const ws = connect();
    window.SimLive.send({ cmd: 'pause' });
    window.SimLive.send({ cmd: 'resume' });
    ws._open();
    expect(ws.sent).toHaveLength(2);
    expect(JSON.parse(ws.sent[0])).toEqual({ cmd: 'pause' });
  });

  it('sends live once the socket is open', () => {
    const ws = connect();
    ws._open();
    window.SimLive.send({ cmd: 'set_time_scale', value: 10 });
    expect(JSON.parse(ws.sent[0])).toEqual({ cmd: 'set_time_scale', value: 10 });
  });

  it('wraps string argument into {cmd: ...}', () => {
    const ws = connect();
    ws._open();
    window.SimLive.send('pause');
    expect(JSON.parse(ws.sent[0])).toEqual({ cmd: 'pause' });
  });
});

describe('SimLive frame handlers', () => {
  it('hello snapshot populates entities/cities/nations', () => {
    const states = [];
    const ws = connect({ onState: s => states.push(s) });
    ws._open();
    ws._recv({
      type: 'hello', t: 0, seq: 1,
      payload: {
        entities: [{ id: 'e1', cls: 'silo', side: 'usa', pos: [40, -100, 0] }],
        cities:   [{ id: 'c1', name: 'X', pos: [10, 10], country: 'usa', population_total: 1 }],
        nations:  [{ iso3: 'usa', name: 'US', capital: 'DC' }],
      }
    });
    expect(states[0].kind).toBe('hello');
    expect(states[0].entities.e1.id).toBe('e1');
    expect(states[0].cities.c1.name).toBe('X');
    expect(states[0].nations[0].iso3).toBe('usa');
  });

  it('tick updates merge into existing entities', () => {
    const states = [];
    const ws = connect({ onState: s => states.push(s) });
    ws._open();
    ws._recv({
      type: 'hello', t: 0, seq: 1,
      payload: { entities: [{ id: 'e1', pos: [0, 0, 0], hp: 1 }], cities: [], nations: [] }
    });
    ws._recv({
      type: 'tick', t: 1, seq: 2,
      payload: { updates: [{ id: 'e1', pos: [10, 10, 0], hp: 0.7 }] }
    });
    const tick = states.find(s => s.kind === 'tick');
    expect(tick.entities.e1.pos[0]).toBe(10);
    expect(tick.entities.e1.hp).toBe(0.7);
  });

  it('tick removed list deletes entities', () => {
    const states = [];
    const ws = connect({ onState: s => states.push(s) });
    ws._open();
    ws._recv({
      type: 'hello', t: 0, seq: 1,
      payload: { entities: [{ id: 'e1' }, { id: 'e2' }], cities: [], nations: [] }
    });
    ws._recv({
      type: 'tick', t: 1, seq: 2,
      payload: { updates: [], removed: ['e1'] }
    });
    const snap = window.SimLive.snapshot();
    expect(snap.entities.find(e => e.id === 'e1')).toBeUndefined();
    expect(snap.entities.find(e => e.id === 'e2')).toBeDefined();
  });

  it('entity_spawn inserts a new entity', () => {
    const ws = connect();
    ws._open();
    ws._recv({
      type: 'hello', t: 0, seq: 1, payload: { entities: [], cities: [], nations: [] }
    });
    ws._recv({ type: 'entity_spawn', t: 0, seq: 2, payload: { id: 'm1', cls: 'icbm', side: 'rus' } });
    const snap = window.SimLive.snapshot();
    expect(snap.entities.find(e => e.id === 'm1')).toBeDefined();
  });

  it('event frames buffer in FIFO order', () => {
    const buffers = [];
    const ws = connect({ onEvents: b => buffers.push(b) });
    ws._open();
    ws._recv({ type: 'event', t: 1, seq: 2, payload: { kind: 'launch', actors: [], data: {} } });
    ws._recv({ type: 'event', t: 2, seq: 3, payload: { kind: 'detect', actors: [], data: {} } });
    const last = buffers.at(-1);
    expect(last.map(e => e.kind)).toEqual(['launch', 'detect']);
  });

  it('event buffer caps at 500 entries', () => {
    const ws = connect();
    ws._open();
    for (let i = 0; i < 600; i++) {
      ws._recv({ type: 'event', t: i, seq: i, payload: { kind: 'detect', actors: [], data: {} } });
    }
    const snap = window.SimLive.snapshot();
    expect(snap.events.length).toBeLessThanOrEqual(500);
  });

  it('metrics frame calls onMetrics', () => {
    const got = [];
    const ws = connect({ onMetrics: (m, t) => got.push({ m, t }) });
    ws._open();
    ws._recv({ type: 'metrics', t: 5, seq: 10, payload: { global: { missiles_in_flight: 3 } } });
    expect(got).toHaveLength(1);
    expect(got[0].m.global.missiles_in_flight).toBe(3);
    expect(got[0].t).toBe(5);
  });

  it('inspect frame calls onInspect', () => {
    const got = [];
    const ws = connect({ onInspect: p => got.push(p) });
    ws._open();
    ws._recv({ type: 'inspect', t: 0, seq: 1, payload: { header: { id: 'x' }, class_spec: {} } });
    expect(got[0].header.id).toBe('x');
  });

  it('ack frame calls onAck', () => {
    const got = [];
    const ws = connect({ onAck: p => got.push(p) });
    ws._open();
    ws._recv({ type: 'ack', t: 0, seq: 1, payload: { launched: ['m1', 'm2'] } });
    expect(got[0].launched).toEqual(['m1', 'm2']);
  });

  it('snapshot returns arrays not live dicts', () => {
    const ws = connect();
    ws._open();
    ws._recv({
      type: 'hello', t: 0, seq: 1,
      payload: { entities: [{ id: 'e1' }], cities: [{ id: 'c1' }], nations: [] }
    });
    const snap = window.SimLive.snapshot();
    expect(Array.isArray(snap.entities)).toBe(true);
    expect(Array.isArray(snap.cities)).toBe(true);
  });

  it('disconnect clears the socket + returns idle', () => {
    const ws = connect();
    ws._open();
    window.SimLive.disconnect();
    expect(window.SimLive.status).toBe('idle');
  });

  it('invalid JSON is ignored (no throw)', () => {
    const ws = connect();
    ws._open();
    expect(() => ws.onmessage && ws.onmessage({ data: '{not-json' })).not.toThrow();
  });
});
