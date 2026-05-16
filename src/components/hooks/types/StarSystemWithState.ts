import type { StarSystemType } from './StarSystemType';
import type { StarSystemState } from './StarSystemState';

export type StarSystemWithState = StarSystemType & {
  state?: StarSystemState;
};
