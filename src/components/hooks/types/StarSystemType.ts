import { ControlInfo } from './ControlInfo';

export interface StarSystemType {
  name: string;
  posX: number;
  posY: number;
  owner: string;
  sysUrl?: string;
  factions: ControlInfo[];
}
