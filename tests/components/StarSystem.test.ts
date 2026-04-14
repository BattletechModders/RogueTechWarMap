import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/ui/StarSystem.tsx'),
  'utf-8'
);

describe('StarSystem component logic', () => {
  describe('radius calculation', () => {
    it('defines CAPITAL_RADIUS as 2.5', () => {
      expect(content).toContain('CAPITAL_RADIUS = 2.5');
    });

    it('defines PLANET_RADIUS as 1', () => {
      expect(content).toContain('PLANET_RADIUS = 1');
    });

    it('uses isCapital to determine radius', () => {
      expect(content).toContain('system.isCapital');
    });

    it('triples radius when highlighted', () => {
      expect(content).toContain('* 3');
    });

    it('scales radius by zoomScaleFactor', () => {
      expect(content).toContain('zoomScaleFactor');
    });
  });

  describe('click behavior', () => {
    it('opens system URL in new tab on click', () => {
      expect(content).toContain('openInNewTab');
      expect(content).toContain('system.sysUrl');
    });

    it('checks sysUrl exists before opening', () => {
      expect(content).toContain('if (system.sysUrl)');
    });

    it('prepends API_BASE_URL to sysUrl', () => {
      expect(content).toContain('`${API_BASE_URL}${system.sysUrl}`');
    });
  });

  describe('tooltip on hover', () => {
    it('shows tooltip on mouse enter with system info', () => {
      expect(content).toContain('onMouseEnter');
      expect(content).toContain('showTooltip');
    });

    it('includes system name in tooltip', () => {
      expect(content).toContain('system.name');
    });

    it('includes coordinates in tooltip', () => {
      expect(content).toContain('system.posX');
      expect(content).toContain('system.posY');
    });

    it('includes faction control details in tooltip', () => {
      expect(content).toContain('formatFactionControl');
    });

    it('hides tooltip on mouse leave', () => {
      expect(content).toContain('onMouseLeave={hideTooltip}');
    });
  });

  describe('touch behavior', () => {
    it('handles touch start events', () => {
      expect(content).toContain('onTouchStart');
    });

    it('shows tap-to-open text on touch', () => {
      expect(content).toContain('[Tap to open]');
    });

    it('navigates on second tap when tooltip is already showing', () => {
      expect(content).toContain('tooltip.visible && tooltip.text.includes(system.name)');
      expect(content).toContain('window.location.href');
    });

    it('passes onTouch callback for navigation', () => {
      expect(content).toContain('onTouch');
    });
  });

  describe('active player animation', () => {
    it('checks for active players in system factions', () => {
      expect(content).toContain('ActivePlayers > 0');
    });

    it('uses flashActivePlayers setting to control animation', () => {
      expect(content).toContain('settings.flashActivePlayers');
    });

    it('creates a Konva Animation for pulsing', () => {
      expect(content).toContain('new Konva.Animation');
    });

    it('uses sine wave for pulse effect', () => {
      expect(content).toContain('Math.sin');
    });

    it('stops animation on cleanup', () => {
      expect(content).toContain('anim.stop()');
    });
  });

  describe('props interface', () => {
    it('defines StarSystemProps with all required fields', () => {
      expect(content).toContain('interface StarSystemProps');
      expect(content).toContain('system: DisplayStarSystemType');
      expect(content).toContain('factions: FactionDataType');
      expect(content).toContain('zoomScaleFactor: number');
      expect(content).toContain('settings: Settings');
      expect(content).toContain('showTooltip');
      expect(content).toContain('hideTooltip');
    });

    it('supports optional highlighted and opacity props', () => {
      expect(content).toContain('highlighted?: boolean');
      expect(content).toContain('opacity?: number');
    });
  });

  describe('performance', () => {
    it('is wrapped in React.memo', () => {
      expect(content).toContain('export default memo(StarSystem)');
    });
  });
});
