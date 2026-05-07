import type { StarSystemWithState } from './StarSystemWithState';

export type DisplayStarSystemType = StarSystemWithState & {
  isCapital: boolean;
  factionColour: string;
  factionName: string;
  normalizedName: string;
};
