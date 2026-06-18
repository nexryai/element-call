/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { type ReactNode } from "react";
import { useObservableEagerState } from "observable-hooks";

import { type CallLayout } from "./CallLayout";
import { type MultiviewLayout as MultiviewLayoutModel } from "../state/layout-types.ts";
import styles from "./MultiviewLayout.module.css";
import { useUpdateLayout, useVisibleTiles } from "./Grid";

/**
 * An implementation of the "multiview" layout, in which multiple screen shares
 * are shown simultaneously in a grid arrangement, with a participant rail
 * at the bottom.
 */
export const makeMultiviewLayout: CallLayout<MultiviewLayoutModel> = ({
  minBounds$,
}) => ({
  foreground: "fixed",

  // The fixed (non-scrolling) layer contains the screen share tiles
  fixed: function MultiviewLayoutFixed({ ref, model, Slot }): ReactNode {
    useUpdateLayout();
    useObservableEagerState(minBounds$);

    return (
      <div ref={ref} className={styles.layer}>
        <div className={styles.multiviewGrid}>
          {model.screenShares.map((vm) => {
            // Each SpotlightTileViewModel in multiview wraps exactly one
            // screen share. Use the underlying media VM's id for stable keying.
            const mediaId = vm.media$.value[0]?.id ?? "unknown";
            const slotId = `multiview-ss-${mediaId}`;
            return (
              <Slot
                key={slotId}
                className={styles.slot}
                id={slotId}
                model={vm}
              />
            );
          })}
        </div>
        <div className={styles.participantRail} />
      </div>
    );
  },

  // The scrolling layer contains the participant rail
  scrolling: function MultiviewLayoutScrolling({
    ref,
    model,
    Slot,
  }): ReactNode {
    useUpdateLayout();
    useVisibleTiles(model.setVisibleTiles);
    useObservableEagerState(minBounds$);

    return (
      <div ref={ref} className={styles.layer}>
        <div className={styles.multiviewGrid} />
        <div className={styles.participantRail}>
          {model.grid.map((m) => (
            <Slot key={m.id} className={styles.slot} id={m.id} model={m} />
          ))}
        </div>
      </div>
    );
  },
});
