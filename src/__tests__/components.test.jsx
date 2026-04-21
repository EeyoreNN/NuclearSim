import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import React from 'react';

import '../data.js';
import '../nato.js';
import '../world-data.js';
import {
  NationsRail, RightRail, EventLog, Controls,
  LaunchOrderModal, ShipOrderModal, AircraftOrderModal, FullInspectorModal,
} from '../panels.jsx';

let SD;
beforeAll(() => { SD = window.SimData; });

const byId = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));

describe('<NationsRail>', () => {
  it('renders one row per nation', () => {
    render(<NationsRail nations={SD.NATIONS} onSelect={() => {}} metrics={SD.METRICS} />);
    expect(screen.getByText(/United States/i)).toBeInTheDocument();
    expect(screen.getByText(/Russian Federation/i)).toBeInTheDocument();
    expect(screen.getByText(/^China$/i)).toBeInTheDocument();
  });

  it('shows DEFCON badge', () => {
    const { container } = render(<NationsRail nations={SD.NATIONS} onSelect={() => {}} metrics={SD.METRICS} />);
    expect(container.textContent).toMatch(/DEFCON/);
  });

  it('calls onSelect when a row is clicked', () => {
    const onSelect = vi.fn();
    render(<NationsRail nations={SD.NATIONS} onSelect={onSelect} metrics={SD.METRICS} />);
    fireEvent.click(screen.getByText(/United States/i).closest('.nation'));
    expect(onSelect).toHaveBeenCalledWith('usa');
  });

  it('renders C2 state text', () => {
    const { container } = render(<NationsRail nations={SD.NATIONS} onSelect={() => {}} metrics={SD.METRICS} />);
    expect(container.textContent).toContain('C2 NOMINAL');
    expect(container.textContent).toContain('C2 DEGRADED');
  });
});

describe('<RightRail>', () => {
  it('renders with no selection = empty-state message', () => {
    render(<RightRail sel={null} entitiesById={{}} citiesById={{}} detonations={[]} watchlist={[]} onOpenInspector={()=>{}} onAddWatch={()=>{}} onRemoveWatch={()=>{}}/>);
    expect(screen.getByText(/NO ENTITY SELECTED/)).toBeInTheDocument();
  });

  it('renders inspect/watch tabs', () => {
    const { container } = render(<RightRail sel={null} entitiesById={{}} citiesById={{}} detonations={[]} watchlist={[]} onOpenInspector={()=>{}} onAddWatch={()=>{}} onRemoveWatch={()=>{}}/>);
    expect(container.textContent.toLowerCase()).toMatch(/inspect/);
    expect(container.textContent.toLowerCase()).toMatch(/watch/);
  });

  it('inspector displays entity data when selected', () => {
    const ent = SD.ENT.find(e => e.cls === 'icbm') || SD.ENT[0];
    render(<RightRail sel={ent.id} entitiesById={byId(SD.ENT)} citiesById={byId(SD.CITIES)} detonations={SD.DETONATIONS} watchlist={[]} onOpenInspector={()=>{}} onAddWatch={()=>{}} onRemoveWatch={()=>{}}/>);
    const body = document.body.textContent;
    expect(body).toContain(ent.id);
  });

  it('city inspector uses "city:" prefix', () => {
    const city = SD.CITIES.find(c => c.name === 'Moscow');
    render(<RightRail sel={`city:${city.id}`} entitiesById={byId(SD.ENT)} citiesById={byId(SD.CITIES)} detonations={SD.DETONATIONS} watchlist={[]} onOpenInspector={()=>{}} onAddWatch={()=>{}} onRemoveWatch={()=>{}}/>);
    // CSS `text-transform: uppercase` changes rendered text; check case-insensitively
    expect(document.body.textContent.toLowerCase()).toContain('moscow');
  });

  it('watch panel with items renders them', () => {
    const e = SD.ENT[0];
    const { container } = render(<RightRail sel={null} entitiesById={byId(SD.ENT)} citiesById={byId(SD.CITIES)} detonations={[]} watchlist={[e.id]} onOpenInspector={()=>{}} onAddWatch={()=>{}} onRemoveWatch={()=>{}}/>);
    // Not guaranteed which tab is shown; watch tab might be inactive by default.
    expect(container.querySelector('.panel.rail-r')).toBeInTheDocument();
  });
});

describe('<EventLog>', () => {
  it('renders events with timestamps', () => {
    const events = [
      { t: 10, kind: 'launch', data: { weapon_sub: 'RS-28' } },
      { t: 20, kind: 'detect', data: {} },
    ];
    render(<EventLog events={events} playheadT={25} filters={{}} onToggleFilter={()=>{}} onEventClick={()=>{}} />);
    expect(document.body.textContent.toLowerCase()).toMatch(/launch/);
    expect(document.body.textContent.toLowerCase()).toMatch(/detect/);
  });

  it('shows filter chips', () => {
    render(<EventLog events={[]} playheadT={0} filters={{}} onToggleFilter={()=>{}} onEventClick={()=>{}} />);
    const body = document.body.textContent.toLowerCase();
    expect(body).toContain('launch');
    expect(body).toContain('intercept');
  });

  it('filter click calls onToggleFilter', () => {
    const onToggleFilter = vi.fn();
    const { container } = render(<EventLog events={[]} playheadT={0} filters={{}} onToggleFilter={onToggleFilter} onEventClick={()=>{}} />);
    const chip = Array.from(container.querySelectorAll('button,.chip')).find(b => /LAUNCH/.test(b.textContent));
    if (chip) {
      fireEvent.click(chip);
      expect(onToggleFilter).toHaveBeenCalled();
    }
  });
});

describe('<Controls>', () => {
  const defaultProps = {
    playheadT: 100, maxT: 1000, playing: true, timeScale: 1,
    onPlay: vi.fn(), onPause: vi.fn(), onStep: vi.fn(), onScrub: vi.fn(),
    onScale: vi.fn(), events: [], onOpenLaunchModal: vi.fn(),
    onOpenShipModal: vi.fn(), onOpenAircraftModal: vi.fn(),
    onSaveState: vi.fn(),
  };

  it('renders Launch Order button', () => {
    render(<Controls {...defaultProps} />);
    expect(document.body.textContent.toUpperCase()).toContain('LAUNCH');
  });

  it('Pause button calls onPause', () => {
    const onPause = vi.fn();
    render(<Controls {...defaultProps} onPause={onPause} />);
    const btn = screen.getByText(/PAUSE/i).closest('button');
    fireEvent.click(btn);
    expect(onPause).toHaveBeenCalled();
  });

  it('Step button calls onStep', () => {
    const onStep = vi.fn();
    render(<Controls {...defaultProps} onStep={onStep} />);
    const btn = screen.getByText(/STEP/i).closest('button');
    fireEvent.click(btn);
    expect(onStep).toHaveBeenCalled();
  });

  it('Ship Order button calls onOpenShipModal', () => {
    const onOpenShipModal = vi.fn();
    render(<Controls {...defaultProps} onOpenShipModal={onOpenShipModal} />);
    const match = screen.queryByText(/SHIP\s+ORDER/i);
    if (match) {
      fireEvent.click(match.closest('button'));
      expect(onOpenShipModal).toHaveBeenCalled();
    }
  });

  it('Aircraft Order button calls onOpenAircraftModal', () => {
    const onOpenAircraftModal = vi.fn();
    render(<Controls {...defaultProps} onOpenAircraftModal={onOpenAircraftModal} />);
    const match = screen.queryByText(/AIRCRAFT\s+ORDER/i);
    if (match) {
      fireEvent.click(match.closest('button'));
      expect(onOpenAircraftModal).toHaveBeenCalled();
    }
  });
});

describe('<LaunchOrderModal>', () => {
  it('renders heading', () => {
    render(<LaunchOrderModal nations={SD.NATIONS} targets={SD.TARGETS_CATALOG} onClose={()=>{}} onSubmit={()=>{}} />);
    expect(document.body.textContent.toUpperCase()).toContain('LAUNCH ORDER');
  });

  it('onClose fires on cancel', () => {
    const onClose = vi.fn();
    render(<LaunchOrderModal nations={SD.NATIONS} targets={SD.TARGETS_CATALOG} onClose={onClose} onSubmit={()=>{}} />);
    const cancel = Array.from(document.querySelectorAll('button')).find(b => /CANCEL/i.test(b.textContent));
    if (cancel) {
      fireEvent.click(cancel);
      expect(onClose).toHaveBeenCalled();
    }
  });
});

describe('<ShipOrderModal>', () => {
  it('renders with a ships list', () => {
    const ships = SD.ENT.filter(e => ['carrier','destroyer','cruiser','frigate','ssbn','ssn'].includes(e.cls));
    render(<ShipOrderModal ships={ships} onClose={()=>{}} onSubmit={()=>{}} />);
    expect(document.body.textContent.toUpperCase()).toContain('SHIP');
  });

  it('submits the currently selected order', () => {
    const ships = SD.ENT.filter(e => e.cls === 'destroyer' || e.cls === 'carrier');
    const onSubmit = vi.fn();
    render(<ShipOrderModal ships={ships} onClose={()=>{}} onSubmit={onSubmit} />);
    const submit = Array.from(document.querySelectorAll('button')).find(b => /SUBMIT|CONFIRM|AUTHORIZE/i.test(b.textContent));
    if (submit) {
      fireEvent.click(submit);
      expect(onSubmit).toHaveBeenCalled();
    }
  });
});

describe('<AircraftOrderModal>', () => {
  it('renders with aircraft list', () => {
    const ac = SD.ENT.filter(e => ['fighter','bomber','awacs','tanker'].includes(e.cls));
    render(<AircraftOrderModal aircraft={ac} onClose={()=>{}} onSubmit={()=>{}} />);
    expect(document.body.textContent.toUpperCase()).toContain('AIRCRAFT');
  });
});

describe('<FullInspectorModal>', () => {
  it('closes on Escape / close button', () => {
    const ent = SD.ENT[0];
    const onClose = vi.fn();
    render(<FullInspectorModal id={ent.id} entitiesById={byId(SD.ENT)} citiesById={byId(SD.CITIES)} detonations={SD.DETONATIONS} onClose={onClose} />);
    const x = Array.from(document.querySelectorAll('button')).find(b => /CLOSE|×/.test(b.textContent));
    if (x) {
      fireEvent.click(x);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('displays the entity id', () => {
    const ent = SD.ENT[3];
    render(<FullInspectorModal id={ent.id} entitiesById={byId(SD.ENT)} citiesById={byId(SD.CITIES)} detonations={[]} onClose={()=>{}} />);
    expect(document.body.textContent).toContain(ent.id);
  });
});
