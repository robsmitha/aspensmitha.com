/**
 * Admin view of a photo (/api/manage/photos, and a story's photos in
 * /api/manage/stories/{id}), in any processing state.
 */
export interface ManagedPhoto {
  id: string
  category: string
  /** Set when the photo belongs to a story */
  storyId: string | null
  /** Site spots this photo fills (see sitePlacements.ts) */
  placements: string[]
  sortOrder: number
  altText: string | null
  width: number | null
  height: number | null
  focusX: number
  focusY: number
  placeholder: string | null
  srcBase: string | null
  widths: number[]
  status: 'Uploaded' | 'Processing' | 'Ready' | 'Failed'
  processingError: string | null
  originalFileName: string
  originalFileSize: number
  createdAt: string
}

export function byManagedOrder(a: ManagedPhoto, b: ManagedPhoto) {
  return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
}

/** Smallest variant at least `min` wide, else the largest */
export function managedPhotoWidth(photo: ManagedPhoto, min = 400) {
  return photo.widths.find(w => w >= min) ?? photo.widths[photo.widths.length - 1]
}
