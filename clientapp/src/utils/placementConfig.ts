/**
 * Where Home/Portfolio placement photos come from (see placementImages.ts).
 * VITE_PLACEMENT_SOURCE=api is the rollback switch: those pages go back to
 * loading /api/portfolio and rendering whatever it returns, exactly as before.
 */
export const PLACEMENT_IMAGE_BASE: string = import.meta.env.VITE_PLACEMENT_IMAGE_BASE ?? ''

export const PLACEMENTS_FROM_CDN: boolean = import.meta.env.VITE_PLACEMENT_SOURCE === 'cdn' && !!PLACEMENT_IMAGE_BASE
