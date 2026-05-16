import { ControlInfo } from './ControlInfo';
import type { StarSystemState } from './StarSystemState';

export interface StarSystemType {
  name: string;
  posX: number;
  posY: number;
  owner: string;
  sysUrl?: string;
  factions: ControlInfo[];
  state?: StarSystemState;
  damageLevel?: string | number | null;
}
