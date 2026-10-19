/**
 * Masonry layout shared by the public gallery and the admin preview, so the
 * preview always matches the site.
 *
 * Photos are placed in sort order, each into whichever column is currently
 * shortest. That keeps earlier photos near the top and reading roughly left to
 * right, so the admin sort order still controls how the gallery looks.
 */

/** Shape used for photos that haven't been measured yet (still processing) */
export const FALLBACK_RATIO = 1.25

export interface MasonryItem<T> {
  item: T
  /** Position in the original sort order (for the lightbox) */
  index: number
}

export function masonryColumns<T extends { width?: number | null, height?: number | null }>(
  items: readonly T[],
  columnCount: number,
  /** Gap between photos as a fraction of a column's width */
  gapRatio = 0.06,
): MasonryItem<T>[][] {
  const count = Math.max(1, Math.floor(columnCount))
  const columns: MasonryItem<T>[][] = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)

  items.forEach((item, index) => {
    // First shortest column wins ties, so the top row fills left to right
    let target = 0
    for (let c = 1; c < count; c++) {
      if (heights[c] < heights[target] - 1e-6) target = c
    }
    columns[target].push({ item, index })
    heights[target] += aspectHeight(item) + gapRatio
  })

  return columns
}

/** Height of a photo when its width is 1 */
export function aspectHeight(photo: { width?: number | null, height?: number | null }): number {
  return photo.width && photo.height ? photo.height / photo.width : FALLBACK_RATIO
}
