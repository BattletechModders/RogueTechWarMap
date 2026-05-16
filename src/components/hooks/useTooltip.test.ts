import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import useTooltip from './useTooltip';

const renderWithScale = (initialScale: number | null = 1) =>
  renderHook(() => {
    const scaleRef = useRef<number | null>(initialScale);
    return useTooltip(scaleRef as React.RefObject<number>);
  });

describe('useTooltip', () => {
  it('starts hidden with empty text at the origin', () => {
    const { result } = renderWithScale();
    expect(result.current.tooltip).toEqual({
      visible: false,
      text: '',
      x: 0,
      y: 0,
    });
  });

  it('showTooltip without stage offsets uses the pointer coordinates directly', () => {
    const { result } = renderWithScale(1);

    act(() => {
      result.current.showTooltip('label', 150, 200);
    });

    expect(result.current.tooltip).toMatchObject({
      visible: true,
      text: 'label',
      x: 150,
      y: 200,
    });
  });

  it('showTooltip with stage offsets applies the scale-normalized world position', () => {
    const { result } = renderWithScale(2);

    act(() => {
      result.current.showTooltip('label', 300, 400, 100, 200);
    });

    // (300 - 100) / 2 = 100, (400 - 200) / 2 = 100
    expect(result.current.tooltip.x).toBe(100);
    expect(result.current.tooltip.y).toBe(100);
  });

  it('falls back to scale=1 when the scale ref is null or zero', () => {
    const { result } = renderWithScale(null);
    act(() => {
      result.current.showTooltip('label', 50, 70, 0, 0);
    });
    expect(result.current.tooltip.x).toBe(50);
    expect(result.current.tooltip.y).toBe(70);
  });

  it('carries onTouch and controlItems through to the tooltip state', () => {
    const { result } = renderWithScale();
    const onTouch = () => {};
    const controlItems = [{ name: 'Davion', control: 50, players: 3 }];

    act(() => {
      result.current.showTooltip('label', 10, 20, undefined, undefined, onTouch, controlItems);
    });

    expect(result.current.tooltip.onTouch).toBe(onTouch);
    expect(result.current.tooltip.controlItems).toEqual(controlItems);
  });

  it('hideTooltip only toggles visible to false, preserving the remaining state', () => {
    const { result } = renderWithScale();

    act(() => result.current.showTooltip('label', 10, 20));
    act(() => result.current.hideTooltip());

    expect(result.current.tooltip.visible).toBe(false);
    expect(result.current.tooltip.text).toBe('label');
    expect(result.current.tooltip.x).toBe(10);
    expect(result.current.tooltip.y).toBe(20);
  });
});
