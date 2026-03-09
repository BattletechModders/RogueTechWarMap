import type { StarSystemState, StarSystemType } from '../hooks/types';

const ENABLE_QUERY_PARAM = 'stateTest';
const PRESET_QUERY_PARAM = 'statePreset';
const ENABLE_STORAGE_KEY = 'warMapDevStateTest';
const PRESET_STORAGE_KEY = 'warMapDevStatePreset';
const OVERRIDES_STORAGE_KEY = 'warMapDevStateOverrides';
const DEV_INSURRECTION_SYSTEMS = [
  'Terra',
  'Altair',
  'Asta',
  'Bryant',
  'Caph',
  'Dieron',
  'Epsilon Eridani',
  'Fomalhaut',
  'Keid',
  'New Home',
  'New Stevens',
  'Saffel',
];
const DEV_PIRATE_RAID_SYSTEMS = [
  'Conwy',
  'Algol',
  'Algot',
  'Almach',
  'Alrescha',
  'Buchlau',
  'Demeter',
  'Foochow',
  'Halloran',
  'Hunan',
  'Kansu',
  'Menkar',
  'New Aragon',
  'New Hessen',
  'Ningpo',
  'Pleione',
  'Poznan',
  'Slocum',
  'Tianamon',
  'Yangtze',
];
const DEV_HOLD_THE_LINE_SYSTEMS = ['Alnadal'];

type StateOverrideMap = Record<string, StarSystemState>;

const isTruthyFlag = (value: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== '0' && normalized !== 'false' && normalized !== 'off';
};

const isStateOverrideMap = (value: unknown): value is StateOverrideMap => {
  if (!value || typeof value !== 'object') return false;

  return Object.values(value).every((state) => {
    if (!state || typeof state !== 'object') return false;

    const typed = state as StarSystemState;
    return (
      (typed.isInsurrect === undefined ||
        typeof typed.isInsurrect === 'boolean') &&
      (typed.hasPirateRaid === undefined ||
        typeof typed.hasPirateRaid === 'boolean') &&
      (typed.hasCaptureEvent === undefined ||
        typeof typed.hasCaptureEvent === 'boolean') &&
      (typed.hasHoldTheLineEvent === undefined ||
        typeof typed.hasHoldTheLineEvent === 'boolean')
    );
  });
};

const buildSampleOverrides = (systems: StarSystemType[]): StateOverrideMap => {
  const byName = [...systems].sort((a, b) => a.name.localeCompare(b.name));
  const selected = byName.slice(0, 5);
  const [a, b, c, d, e] = selected;
  const overrides: StateOverrideMap = {};

  if (a) overrides[a.name] = { isInsurrect: true };
  if (b) overrides[b.name] = { hasPirateRaid: true };
  if (c) overrides[c.name] = { hasCaptureEvent: true };
  if (d) overrides[d.name] = { hasHoldTheLineEvent: true };
  if (e) {
    overrides[e.name] = {
      hasPirateRaid: true,
      hasCaptureEvent: true,
    };
  }

  return overrides;
};

const buildDenseOverrides = (systems: StarSystemType[]): StateOverrideMap => {
  const byName = [...systems].sort((a, b) => a.name.localeCompare(b.name));
  const selected = byName.slice(0, 12);
  const overrides: StateOverrideMap = {};

  selected.forEach((system, idx) => {
    const mode = idx % 4;
    if (mode === 0) overrides[system.name] = { isInsurrect: true };
    if (mode === 1) overrides[system.name] = { hasPirateRaid: true };
    if (mode === 2) overrides[system.name] = { hasCaptureEvent: true };
    if (mode === 3) overrides[system.name] = { hasHoldTheLineEvent: true };
  });

  return overrides;
};

const readOverridesFromStorage = (): StateOverrideMap | null => {
  const raw = window.localStorage.getItem(OVERRIDES_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStateOverrideMap(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Invalid dev state override JSON in localStorage.', error);
  }

  return null;
};

const buildNamedInsurrectionOverrides = (
  systems: StarSystemType[]
): StateOverrideMap => {
  const systemNameLookup = new Map(
    systems.map((system) => [system.name.toLowerCase(), system.name])
  );
  const overrides: StateOverrideMap = {};

  DEV_INSURRECTION_SYSTEMS.forEach((targetName) => {
    const canonicalName = systemNameLookup.get(targetName.toLowerCase());
    if (!canonicalName) return;
    overrides[canonicalName] = { isInsurrect: true };
  });

  return overrides;
};

const buildNamedPirateRaidOverrides = (
  systems: StarSystemType[]
): StateOverrideMap => {
  const systemNameLookup = new Map(
    systems.map((system) => [system.name.toLowerCase(), system.name])
  );
  const overrides: StateOverrideMap = {};

  DEV_PIRATE_RAID_SYSTEMS.forEach((targetName) => {
    const canonicalName = systemNameLookup.get(targetName.toLowerCase());
    if (!canonicalName) return;
    overrides[canonicalName] = { hasPirateRaid: true };
  });

  return overrides;
};

const buildNamedHoldTheLineOverrides = (
  systems: StarSystemType[]
): StateOverrideMap => {
  const systemNameLookup = new Map(
    systems.map((system) => [system.name.toLowerCase(), system.name])
  );
  const overrides: StateOverrideMap = {};

  DEV_HOLD_THE_LINE_SYSTEMS.forEach((targetName) => {
    const canonicalName = systemNameLookup.get(targetName.toLowerCase());
    if (!canonicalName) return;
    overrides[canonicalName] = { hasHoldTheLineEvent: true };
  });

  return overrides;
};

export const applyDevStateInjection = (
  systems: StarSystemType[]
): StarSystemType[] => {
  const allowInjectedStates =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_STATE_TEST === 'true';
  if (!allowInjectedStates || typeof window === 'undefined') return systems;

  const params = new URLSearchParams(window.location.search);
  const enabled =
    isTruthyFlag(params.get(ENABLE_QUERY_PARAM)) ||
    isTruthyFlag(window.localStorage.getItem(ENABLE_STORAGE_KEY));

  if (!enabled) return systems;

  const preset =
    params.get(PRESET_QUERY_PARAM) ||
    window.localStorage.getItem(PRESET_STORAGE_KEY) ||
    'sample';
  const customOverrides = readOverridesFromStorage();
  const namedInsurrectionOverrides = buildNamedInsurrectionOverrides(systems);
  const namedPirateRaidOverrides = buildNamedPirateRaidOverrides(systems);
  const namedHoldTheLineOverrides = buildNamedHoldTheLineOverrides(systems);

  const presetOverrides =
    preset === 'dense'
      ? buildDenseOverrides(systems)
      : buildSampleOverrides(systems);
  const overrides = {
    ...presetOverrides,
    ...namedInsurrectionOverrides,
    ...namedPirateRaidOverrides,
    ...namedHoldTheLineOverrides,
    ...customOverrides,
  };

  if (!Object.keys(overrides).length) return systems;

  return systems.map((system) => {
    const injected = overrides[system.name];
    if (!injected) return system;

    return {
      ...system,
      state: {
        ...system.state,
        ...injected,
      },
    };
  });
};
