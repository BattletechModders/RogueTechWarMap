import { describe, it, expect } from 'vitest';
import {
  buildControlItems,
  buildTooltipText,
  formatControlLine,
  formatDamageLevel,
  formatSystemState,
} from './StarSystem.helpers';
import type { FactionDataType, StarSystemType } from '../hooks/types';

const factions: FactionDataType = {
  DAVION: {
    colour: '#ff0',
    prettyName: 'House Davion',
    id: 1,
    capital: 'New Avalon',
  },
  KURITA: {
    colour: '#f00',
    prettyName: 'House Kurita',
    id: 2,
    capital: 'Luthien',
  },
};

describe('buildControlItems', () => {
  it('returns items sorted by control descending, using prettyName when available', () => {
    const result = buildControlItems(
      [
        { Name: 'DAVION', control: 20, ActivePlayers: 1 },
        { Name: 'KURITA', control: 60, ActivePlayers: 3 },
      ],
      factions
    );

    expect(result).toEqual([
      { name: 'House Kurita', control: 60, players: 3 },
      { name: 'House Davion', control: 20, players: 1 },
    ]);
  });

  it('falls back to the raw faction Name when no prettyName is registered', () => {
    const result = buildControlItems(
      [{ Name: 'UNKNOWN', control: 10, ActivePlayers: 0 }],
      factions
    );
    expect(result[0].name).toBe('UNKNOWN');
  });

  it('does not mutate the input array', () => {
    const input = [
      { Name: 'DAVION', control: 20, ActivePlayers: 1 },
      { Name: 'KURITA', control: 60, ActivePlayers: 3 },
    ];
    const snapshot = [...input];
    buildControlItems(input, factions);
    expect(input).toEqual(snapshot);
  });

  it('returns an empty array for no factions', () => {
    expect(buildControlItems([], factions)).toEqual([]);
  });
});

describe('formatControlLine', () => {
  it('renders the expected "Name control% · players" shape', () => {
    expect(
      formatControlLine({ name: 'Davion', control: 55, players: 4 })
    ).toBe('Davion 55% · 4');
  });
});

describe('formatSystemState', () => {
  it('returns "None" for undefined state', () => {
    expect(formatSystemState(undefined)).toBe('None');
  });

  it('returns "None" for an object with only falsy flags', () => {
    expect(
      formatSystemState({
        isInsurrect: false,
        hasPirateRaid: false,
        hasCaptureEvent: false,
        hasHoldTheLineEvent: false,
      })
    ).toBe('None');
  });

  it('returns the matching human-readable label for each active flag', () => {
    expect(formatSystemState({ isInsurrect: true })).toBe('Insurrection');
    expect(formatSystemState({ hasPirateRaid: true })).toBe('Pirate Raid');
    expect(formatSystemState({ hasCaptureEvent: true })).toBe('Capture Event');
    expect(formatSystemState({ hasHoldTheLineEvent: true })).toBe(
      'Hold The Line Event'
    );
  });

  it('joins multiple active flags with commas in definition order', () => {
    expect(
      formatSystemState({ isInsurrect: true, hasPirateRaid: true })
    ).toBe('Insurrection, Pirate Raid');
    expect(
      formatSystemState({
        hasCaptureEvent: true,
        hasHoldTheLineEvent: true,
        isInsurrect: true,
      })
    ).toBe('Insurrection, Capture Event, Hold The Line Event');
  });
});

describe('formatDamageLevel', () => {
  it('returns "Unknown" for undefined, null, or whitespace-only values', () => {
    expect(formatDamageLevel(undefined)).toBe('Unknown');
    expect(formatDamageLevel(null)).toBe('Unknown');
    expect(formatDamageLevel('')).toBe('Unknown');
    expect(formatDamageLevel('   ')).toBe('Unknown');
  });

  it('stringifies numeric and string inputs', () => {
    expect(formatDamageLevel(0)).toBe('0');
    expect(formatDamageLevel(42)).toBe('42');
    expect(formatDamageLevel('moderate')).toBe('moderate');
  });
});

const baseSystem: StarSystemType = {
  name: 'Terra',
  posX: 10,
  posY: -20,
  owner: 'DAVION',
  factions: [
    { Name: 'DAVION', control: 60, ActivePlayers: 3 },
    { Name: 'KURITA', control: 40, ActivePlayers: 1 },
  ],
};

describe('buildTooltipText', () => {
  it('composes owner, coordinates, top-3 control, and damage line', () => {
    const { text, controlItems } = buildTooltipText({
      system: baseSystem,
      factions,
    });

    expect(controlItems).toHaveLength(2);
    expect(text).toBe(
      [
        'Terra',
        '(10, -20)',
        'Owner: House Davion',
        'Control:',
        'House Davion 60% · 3',
        'House Kurita 40% · 1',
        'Damage: Unknown',
      ].join('\n')
    );
  });

  it('adds a "+N more" line when more than 3 factions hold control', () => {
    const many: StarSystemType = {
      ...baseSystem,
      factions: [
        { Name: 'A', control: 50, ActivePlayers: 0 },
        { Name: 'B', control: 40, ActivePlayers: 0 },
        { Name: 'C', control: 30, ActivePlayers: 0 },
        { Name: 'D', control: 20, ActivePlayers: 0 },
        { Name: 'E', control: 10, ActivePlayers: 0 },
      ],
    };
    const { text } = buildTooltipText({ system: many, factions });
    expect(text).toContain('+2 more');
  });

  it('includes a state line only when state is non-None', () => {
    const stateful: StarSystemType = {
      ...baseSystem,
      state: { isInsurrect: true, hasPirateRaid: true },
    };
    const { text } = buildTooltipText({ system: stateful, factions });
    expect(text).toContain('State: Insurrection, Pirate Raid');
  });

  it('omits the state line when no flag is set', () => {
    const noState: StarSystemType = { ...baseSystem, state: {} };
    const { text } = buildTooltipText({ system: noState, factions });
    expect(text).not.toContain('State:');
  });

  it('appends the tap-to-open hint when includeTapHint is true', () => {
    const { text } = buildTooltipText({
      system: baseSystem,
      factions,
      includeTapHint: true,
    });
    expect(text.endsWith('[Tap to open]')).toBe(true);
  });

  it('labels the owner as "Unknown" when the faction is not registered', () => {
    const orphan: StarSystemType = { ...baseSystem, owner: 'MISSING' };
    const { text } = buildTooltipText({ system: orphan, factions });
    expect(text).toContain('Owner: Unknown');
  });

  it('uses the damage level when present', () => {
    const damaged: StarSystemType = { ...baseSystem, damageLevel: 'Heavy' };
    const { text } = buildTooltipText({ system: damaged, factions });
    expect(text).toContain('Damage: Heavy');
  });
});
