import { expectTypeOf, describe, it, expect } from 'vitest';
import type {
  ControlInfo,
  StarSystemType,
  DisplayStarSystemType,
  FactionType,
  FactionDataType,
  Settings,
} from '../src/components/hooks/types';
import { initialSettings } from '../src/components/hooks/types';

describe('ControlInfo', () => {
  it('has Name as string', () => {
    expectTypeOf<ControlInfo['Name']>().toBeString();
  });

  it('has control as number', () => {
    expectTypeOf<ControlInfo['control']>().toBeNumber();
  });

  it('has ActivePlayers as number', () => {
    expectTypeOf<ControlInfo['ActivePlayers']>().toBeNumber();
  });
});

describe('StarSystemType', () => {
  it('has required string fields', () => {
    expectTypeOf<StarSystemType['name']>().toBeString();
    expectTypeOf<StarSystemType['owner']>().toBeString();
  });

  it('has required number fields for coordinates', () => {
    expectTypeOf<StarSystemType['posX']>().toBeNumber();
    expectTypeOf<StarSystemType['posY']>().toBeNumber();
  });

  it('has optional sysUrl', () => {
    expectTypeOf<StarSystemType['sysUrl']>().toEqualTypeOf<string | undefined>();
  });

  it('has factions as ControlInfo array', () => {
    expectTypeOf<StarSystemType['factions']>().toEqualTypeOf<ControlInfo[]>();
  });

  it('accepts a valid StarSystemType object', () => {
    const system: StarSystemType = {
      name: 'Terra',
      posX: 0,
      posY: 0,
      owner: 'ComStar',
      factions: [{ Name: 'ComStar', control: 100, ActivePlayers: 5 }],
    };
    expectTypeOf(system).toMatchTypeOf<StarSystemType>();
  });
});

describe('DisplayStarSystemType', () => {
  it('extends StarSystemType', () => {
    expectTypeOf<DisplayStarSystemType>().toMatchTypeOf<StarSystemType>();
  });

  it('has isCapital as boolean', () => {
    expectTypeOf<DisplayStarSystemType['isCapital']>().toBeBoolean();
  });

  it('has factionColour as string', () => {
    expectTypeOf<DisplayStarSystemType['factionColour']>().toBeString();
  });

  it('has factionName as string', () => {
    expectTypeOf<DisplayStarSystemType['factionName']>().toBeString();
  });
});

describe('FactionType', () => {
  it('has colour as string', () => {
    expectTypeOf<FactionType['colour']>().toBeString();
  });

  it('has prettyName as string', () => {
    expectTypeOf<FactionType['prettyName']>().toBeString();
  });

  it('has id as number', () => {
    expectTypeOf<FactionType['id']>().toBeNumber();
  });

  it('has capital field', () => {
    // capital is string on main, may be optional on other branches
    expectTypeOf<FactionType>().toHaveProperty('capital');
  });
});

describe('FactionDataType', () => {
  it('is a Record<string, FactionType>', () => {
    expectTypeOf<FactionDataType>().toEqualTypeOf<Record<string, FactionType>>();
  });

  it('allows string key access returning FactionType', () => {
    const data: FactionDataType = {
      Steiner: { colour: 'blue', prettyName: 'House Steiner', id: 1, capital: 'Tharkad' },
    };
    expectTypeOf(data['Steiner']).toMatchTypeOf<FactionType>();
  });
});

describe('Settings', () => {
  it('has flashActivePlayes as boolean', () => {
    expectTypeOf<Settings['flashActivePlayes']>().toBeBoolean();
  });

  it('initialSettings matches Settings type', () => {
    expectTypeOf(initialSettings).toMatchTypeOf<Settings>();
  });

  it('initialSettings.flashActivePlayes is true by default', () => {
    // Runtime value check
    expect(initialSettings.flashActivePlayes).toBe(true);
  });
});
