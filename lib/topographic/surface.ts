/*!
ReactDrops Component License 1.0 — see ./LICENSE.txt
Copyright (c) 2026 ReactDrops
*/

import type { TopographicConfig } from "./renderer";

export type TopographicSurfaceHandle = {
  update: (config: TopographicConfig) => void;
  reset: () => void;
  destroy: () => void;
};

export type TopographicSurfaceFactory = (
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  initial: TopographicConfig,
  onReady?: () => void,
) => TopographicSurfaceHandle | null;

/** Flat 2D path only — relief / WebGL surface is not used in this project. */
export function createTopographicSurface(
  _canvas: HTMLCanvasElement,
  _host: HTMLElement,
  _initial: TopographicConfig,
  _surfaceFactory?: TopographicSurfaceFactory,
  _onReady?: () => void,
): TopographicSurfaceHandle | null {
  return null;
}
