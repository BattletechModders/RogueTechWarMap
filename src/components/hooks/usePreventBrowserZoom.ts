import { useEffect, useState } from 'react';
import Konva from 'konva';
import type { StageSize } from '../GalaxyMap/gm.types';

const usePreventBrowserZoom = (
  stageRef: React.RefObject<Konva.Stage | null>
) => {
  const [stageSize, setStageSize] = useState<StageSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Block Firefox pinch-to-zoom at document level
  useEffect(() => {
    const preventZoomTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventZoomGesture: EventListener = (e) => {
      e.preventDefault();
    };

    const options = { passive: false } as AddEventListenerOptions;

    document.addEventListener('touchmove', preventZoomTouch, options);
    document.addEventListener('gesturestart', preventZoomGesture, options);
    document.addEventListener('gesturechange', preventZoomGesture, options);
    document.addEventListener('gestureend', preventZoomGesture, options);

    return () => {
      document.removeEventListener('touchmove', preventZoomTouch, options);
      document.removeEventListener('gesturestart', preventZoomGesture, options);
      document.removeEventListener(
        'gesturechange',
        preventZoomGesture,
        options
      );
      document.removeEventListener('gestureend', preventZoomGesture, options);
    };
  }, []);

  // Extra locking gesture handling for Firefox
  useEffect(() => {
    const lockScale = (e: Event) => e.preventDefault();

    window.addEventListener('gesturestart', lockScale, { passive: false });
    window.addEventListener('gesturechange', lockScale, { passive: false });
    window.addEventListener('gestureend', lockScale, { passive: false });

    return () => {
      window.removeEventListener('gesturestart', lockScale);
      window.removeEventListener('gesturechange', lockScale);
      window.removeEventListener('gestureend', lockScale);
    };
  }, []);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Block gestures on Konva container
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    const preventDefault = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };

    container.addEventListener('gesturestart', preventDefault, {
      passive: false,
    });
    container.addEventListener('gesturechange', preventDefault, {
      passive: false,
    });
    container.addEventListener('gestureend', preventDefault, {
      passive: false,
    });
    container.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      container.removeEventListener('gesturestart', preventDefault);
      container.removeEventListener('gesturechange', preventDefault);
      container.removeEventListener('gestureend', preventDefault);
      container.removeEventListener('touchmove', preventDefault);
    };
  }, [stageRef]);

  return { stageSize };
};

export default usePreventBrowserZoom;
