import { expectTypeOf, describe, it } from 'vitest';
import type {
  Point,
  StageSize,
  TooltipData,
  TooltipControlItem,
  ViewTransform,
  GalaxyMapRenderProps,
  FactionName,
  FactionNameList,
} from './gm.types';

import type {
  DisplayStarSystemType,
  FactionDataType,
  Settings,
} from '../hooks/types';

describe('gm.types', () => {
  it('Point has x/y as numbers', () => {
    const p: Point = { x: 1, y: 2 };
    expectTypeOf(p.x).toBeNumber();
    expectTypeOf(p.y).toBeNumber();
  });

  it('StageSize matches width/height numbers', () => {
    const s: StageSize = { width: 800, height: 600 };
    expectTypeOf(s.width).toBeNumber();
    expectTypeOf(s.height).toBeNumber();
  });

  it('TooltipData has required fields and optional onTouch / controlItems', () => {
    const t: TooltipData = { visible: true, x: 10, y: 20, text: 'hello' };
    expectTypeOf(t.visible).toBeBoolean();
    expectTypeOf(t.x).toBeNumber();
    expectTypeOf(t.y).toBeNumber();
    expectTypeOf(t.text).toBeString();
    expectTypeOf(t.onTouch).toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<NonNullable<TooltipData['onTouch']>>().toBeFunction();
    expectTypeOf(t.controlItems).toEqualTypeOf<TooltipControlItem[] | undefined>();
  });

  it('TooltipControlItem has name/control/players fields', () => {
    const c: TooltipControlItem = { name: 'x', control: 50, players: 3 };
    expectTypeOf(c.name).toBeString();
    expectTypeOf(c.control).toBeNumber();
    expectTypeOf(c.players).toBeNumber();
  });

  it('ViewTransform includes scale and position as Point', () => {
    const vt: ViewTransform = { scale: 1, position: { x: 0, y: 0 } };
    expectTypeOf(vt.scale).toBeNumber();
    expectTypeOf(vt.position).toMatchTypeOf<Point>();
  });

  it('GalaxyMapRenderProps matches expected shapes', () => {
    expectTypeOf<GalaxyMapRenderProps['systems']>().toEqualTypeOf<
      DisplayStarSystemType[]
    >();
    expectTypeOf<
      GalaxyMapRenderProps['systems'][number]
    >().toEqualTypeOf<DisplayStarSystemType>();
    expectTypeOf<
      GalaxyMapRenderProps['factions']
    >().toEqualTypeOf<FactionDataType>();
    expectTypeOf<GalaxyMapRenderProps['settings']>().toEqualTypeOf<Settings>();
  });

  it('FactionName is a string alias and FactionNameList is FactionName[]', () => {
    const name: FactionName = 'Davion';
    const list: FactionNameList = ['Davion', 'Kurita'];
    expectTypeOf(name).toBeString();
    expectTypeOf(list).toEqualTypeOf<FactionName[]>();
  });
});
