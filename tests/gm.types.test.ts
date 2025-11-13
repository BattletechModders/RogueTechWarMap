import { expectTypeOf, describe, it } from 'vitest';
import type {
  Point,
  StageSize,
  TooltipData,
  ViewTransform,
  GalaxyMapRenderProps,
} from '../src/components/GalaxyMap/gm.types';

import type {
  DisplayStarSystemType,
  FactionDataType,
  Settings,
} from '../src/components/hooks/types';

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

  it('TooltipData has required fields and optional onTouch', () => {
    const t: TooltipData = { visible: true, x: 10, y: 20, text: 'hello' };
    expectTypeOf(t.visible).toBeBoolean();
    expectTypeOf(t.x).toBeNumber();
    expectTypeOf(t.y).toBeNumber();
    expectTypeOf(t.text).toBeString();
    expectTypeOf(t.onTouch).toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<NonNullable<TooltipData['onTouch']>>().toBeFunction();
  });

  it('ViewTransform includes scale and position as Point', () => {
    const vt: ViewTransform = { scale: 1, position: { x: 0, y: 0 } };
    expectTypeOf(vt.scale).toBeNumber();
    expectTypeOf(vt.position).toMatchTypeOf<Point>();
  });

  it('GalaxyMapRenderProps matches expected shapes', () => {
    // systems is an array of DisplayStarSystemType
    expectTypeOf<GalaxyMapRenderProps['systems']>().toEqualTypeOf<
      DisplayStarSystemType[]
    >();

    // individual element type also matches
    expectTypeOf<
      GalaxyMapRenderProps['systems'][number]
    >().toEqualTypeOf<DisplayStarSystemType>();

    // factions matches FactionDataType
    expectTypeOf<
      GalaxyMapRenderProps['factions']
    >().toEqualTypeOf<FactionDataType>();

    // settings matches Settings
    expectTypeOf<GalaxyMapRenderProps['settings']>().toEqualTypeOf<Settings>();
  });
});
