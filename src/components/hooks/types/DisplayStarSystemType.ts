import { StarSystemType } from './StarSystemType';

export type DisplayStarSystemType = StarSystemType & {
  isCapital: boolean;
  factionColour: string;
  factionName: string;
};
