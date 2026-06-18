/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { BehaviorSubject } from "rxjs";

import {
  type MultiviewLayout,
  type MultiviewLayoutMedia,
} from "./layout-types";
import { type TileStore } from "./TileStore";
import { SpotlightTileViewModel } from "./TileViewModel";
import { type MediaViewModel } from "./media/MediaViewModel";

/**
 * Produces a multiview layout with the given media.
 * Each screen share gets its own SpotlightTileViewModel shown simultaneously,
 * and user media are shown in a participant rail as GridTileViewModels.
 */
export function multiviewLayout(
  media: MultiviewLayoutMedia,
  visibleTiles: number,
  setVisibleTiles: (value: number) => void,
  prevTiles: TileStore,
  prevScreenShareTiles: SpotlightTileViewModel[],
): [MultiviewLayout, TileStore, SpotlightTileViewModel[]] {
  // User media goes through the standard TileStore pipeline.
  const update = prevTiles.from(visibleTiles);
  for (const userMedia of media.grid) {
    update.registerGridTile(userMedia);
  }
  const tiles = update.build();

  // Screen shares each get their own SpotlightTileViewModel.
  // We reuse previous VMs where possible (by matching media VM identity)
  // to avoid unnecessary re-renders.
  const newScreenShareTiles: SpotlightTileViewModel[] =
    media.screenShares.map((screenShare) => {
      // Try to find an existing SpotlightTileViewModel that was showing
      // this same screen share
      const existing = prevScreenShareTiles.find((prevTile) => {
        const prevMedia = (prevTile.media$ as BehaviorSubject<MediaViewModel[]>)
          .value;
        return prevMedia.length === 1 && prevMedia[0] === screenShare;
      });

      if (existing) {
        return existing;
      }

      // Create a new SpotlightTileViewModel for this screen share
      const media$ = new BehaviorSubject<MediaViewModel[]>([screenShare]);
      const maximised$ = new BehaviorSubject<boolean>(false);
      return new SpotlightTileViewModel(media$, maximised$);
    });

  return [
    {
      type: "multiview",
      screenShares: newScreenShareTiles,
      grid: tiles.gridTiles,
      setVisibleTiles,
    },
    tiles,
    newScreenShareTiles,
  ];
}
