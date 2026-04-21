// Pull globals the design code expects before any test imports a module
// that reads window.COARSE_WORLD / SimData / NATO / SimLive.
import '@testing-library/jest-dom';
import '../nato.js';
import '../data.js';
import '../world-data.js';
import '../sim-live.js';

// happy-dom doesn't ship a WebSocket by default in older versions; provide a
// minimal stub so sim-live.js construction doesn't throw when tests are
// written that don't care about WS.
if (typeof globalThis.WebSocket === 'undefined') {
  class FakeWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0;
      this.sent = [];
      this.onopen = null; this.onmessage = null; this.onclose = null; this.onerror = null;
    }
    send(data) { this.sent.push(data); }
    close() { this.readyState = 3; this.onclose && this.onclose({ code: 1000 }); }
    // test helpers
    _open() { this.readyState = 1; this.onopen && this.onopen({}); }
    _recv(obj) { this.onmessage && this.onmessage({ data: JSON.stringify(obj) }); }
  }
  globalThis.WebSocket = FakeWebSocket;
  globalThis.__FakeWebSocket__ = FakeWebSocket;
}
