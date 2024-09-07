enum PlanetRenderOptions {
  Dot,
  Region,
}

export type MapRenderOptions = {
  planetRenderOptions: PlanetRenderOptions;
};

export const defaultMapRenderOptions: MapRenderOptions = {
  planetRenderOptions: PlanetRenderOptions.Dot,
};
