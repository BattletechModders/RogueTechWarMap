import { createContext } from 'react';
import { Faction } from '../models/faction';
import { System } from '../models/system';
import {
  defaultMapRenderOptions,
  MapRenderOptions,
} from '../models/render-options';

// Context to load data into
export const FactionContext = createContext<Faction[]>([]);
export const SystemContext = createContext<System[]>([]);

// Render context
export const RenderOptionContext = createContext<MapRenderOptions>(
  defaultMapRenderOptions
);
export const MapSystems = createContext<System[]>([]);
