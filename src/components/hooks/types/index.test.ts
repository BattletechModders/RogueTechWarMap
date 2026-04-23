import { describe, it, expect, expectTypeOf } from 'vitest';
import * as types from './index';
import type {
  ControlInfo,
  DisplayStarSystemType,
  FactionDataType,
  FactionType,
  Settings,
  StarSystemState,
  StarSystemType,
  StarSystemWithState,
} from './index';

describe('hook types barrel', () => {
  it('exposes initialSettings at runtime', () => {
    expect(types.initialSettings).toEqual({ flashActivePlayes: true });
  });

  it('does not leak unexpected runtime exports (only initialSettings)', () => {
    expect(Object.keys(types)).toEqual(['initialSettings']);
  });

  it('surfaces the expected type aliases (compile-time check)', () => {
    expectTypeOf<ControlInfo>().toHaveProperty('Name');
    expectTypeOf<ControlInfo>().toHaveProperty('control');
    expectTypeOf<ControlInfo>().toHaveProperty('ActivePlayers');

    expectTypeOf<FactionType>().toHaveProperty('colour');
    expectTypeOf<FactionType>().toHaveProperty('prettyName');
    expectTypeOf<FactionType>().toHaveProperty('id');
    expectTypeOf<FactionType>().toHaveProperty('capital');

    expectTypeOf<FactionDataType>().toEqualTypeOf<Record<string, FactionType>>();

    expectTypeOf<StarSystemState>().toMatchTypeOf<{
      isInsurrect?: boolean;
      hasPirateRaid?: boolean;
      hasCaptureEvent?: boolean;
      hasHoldTheLineEvent?: boolean;
    }>();

    expectTypeOf<StarSystemType>().toHaveProperty('name');
    expectTypeOf<StarSystemType>().toHaveProperty('posX');
    expectTypeOf<StarSystemType>().toHaveProperty('posY');
    expectTypeOf<StarSystemType>().toHaveProperty('owner');
    expectTypeOf<StarSystemType>().toHaveProperty('factions');

    expectTypeOf<StarSystemWithState>().toMatchTypeOf<StarSystemType>();
    expectTypeOf<DisplayStarSystemType>().toHaveProperty('isCapital');
    expectTypeOf<DisplayStarSystemType>().toHaveProperty('factionColour');
    expectTypeOf<DisplayStarSystemType>().toHaveProperty('factionName');

    expectTypeOf<Settings>().toHaveProperty('flashActivePlayes');
  });
});
