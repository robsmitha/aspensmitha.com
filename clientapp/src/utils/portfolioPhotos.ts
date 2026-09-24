/**
 * Real photos from Aspen's own portfolio (pulled from the live
 * aspensmitha.com gallery/portrait), served through Wix's image CDN so each
 * placement can request the exact crop/size it needs. Swap for a real asset
 * pipeline once there's a proper media library for the rebuild.
 */
const PHOTO_IDS = {
  maternityAnnouncement: '6fbe05_cc85442164fb476aa6f8421a953e9599',
  bridePortrait: '6fbe05_de9a3dfe1d1b404f828c8130b99e8c94',
  coupleJump: '6fbe05_64e49ea99afe4fcfbebc03284e5dd22a',
  familyLittleBrother: '6fbe05_586bac3b867e4505a824b734b5d81105',
  coupleCloseUp: '6fbe05_d5d54e8807a2448186a980506019d7d4',
  aspenPortrait: '6fbe05_cbdf63b0f4564fddb801529ad1d17c6d',
  aspenFamily: '6fbe05_36b9a25632984a99b0022e4605d55c0f',
} as const

export type PortfolioPhoto = keyof typeof PHOTO_IDS

/** Named, hand-picked photos used across the landing/about pages. */
export function portfolioPhoto(photo: PortfolioPhoto, width: number, height: number): string {
  return wixImage(PHOTO_IDS[photo], width, height)
}

/**
 * Any raw Wix media id (the `6fbe05_...` prefix), for galleries pulled
 * wholesale from a live category page rather than hand-picked one at a time.
 */
export function wixImage(id: string, width: number, height: number): string {
  return `https://static.wixstatic.com/media/${id}~mv2.jpg/v1/fill/w_${width},h_${height},al_c,q_85,enc_auto/${id}~mv2.jpg`
}
