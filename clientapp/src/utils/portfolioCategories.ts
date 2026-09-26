/**
 * The Portfolio dropdown categories from the live site. Gallery photos come
 * from the photo store (uploaded via /admin/photos, filed under the slug).
 * `hasGallery: false` (Events) means no placeholder gallery and an inquiry
 * prompt instead; once photos are uploaded to it, they show above the prompt.
 */
export interface PortfolioCategory {
  slug: string
  name: string
  description: string
  hasGallery: boolean
  /** TEMPORARY: Wix POC ids shown until the category has uploaded photos (see legacyPhotos.ts) */
  legacyImages: string[]
}

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  {
    slug: 'couples',
    name: 'Couples',
    description: 'Candid, unposed connection between two people building a life together.',
    hasGallery: true,
    legacyImages: [
      '6fbe05_4e5a45e501cb430d8df369129089f465',
      '6fbe05_e569b629df9845dcad043e7d1217d7b4',
      '6fbe05_878aae64d7be40a8880d750631d2c837',
      '6fbe05_6ffe85f31fc54f559b1334343c5df203',
      '6fbe05_e630f3b1bd1c461ea1e39dd358ec2b33',
      '6fbe05_293df09b593746d885c7e3005ceaef91',
      '6fbe05_6b9ecf5946934984a6885ff52ebd8134',
      '6fbe05_b55a45afbecf4b26ba5cd56e96992079',
      '6fbe05_bdde3b0d19454c4cb9916def4d95e158',
      '6fbe05_743ce1eaa0fe4b49b4febb8869208ced',
      '6fbe05_fe901e403e544fa4bf02ec73e3c9d3fd',
      '6fbe05_a8f3465d807a4d98af3becb85c788fbf',
    ],
  },
  {
    slug: 'engagements',
    name: 'Engagements',
    description: "Celebrating the season between 'yes' and 'I do'.",
    hasGallery: true,
    legacyImages: [
      '6fbe05_8a443d4d2c2c415bab09af8c41718e38',
      '6fbe05_559f507623244dedb54f98f28f89b462',
      '6fbe05_931f3ddfcb6747edac37899210c8da20',
      '6fbe05_528961949a4c4e9080f6e52956f5e683',
      '6fbe05_7757e8eb17574c6dbfe5bd516e2509b6',
      '6fbe05_64da0e09f166419690cb374619feb9cd',
      '6fbe05_db4504bd197b4918b087b17d5522ebe8',
      '6fbe05_5e5766a8e207477491560daf7d815b7b',
      '6fbe05_b150122a71764baba221190514dbdebd',
      '6fbe05_4e00c0bfad284799a5c8632cb93c2a8e',
      '6fbe05_8822d0a498f547b2bf3a46cf25326fe2',
      '6fbe05_86825619597a4594acd546bc565991f5',
    ],
  },
  {
    slug: 'weddings',
    name: 'Weddings',
    description: 'From quiet getting-ready moments to the last dance, documented with an editorial eye.',
    hasGallery: true,
    legacyImages: [
      '6fbe05_de9a3dfe1d1b404f828c8130b99e8c94',
      '6fbe05_ceed89b57ca64d328f61d1d785ad89e2',
      '6fbe05_c29df6d4f1344ff995145451562b425e',
      '6fbe05_bc9f667932594d30a82c62d68f6f1428',
      '6fbe05_0e5833a444c34909b8969ddf4c67afe8',
      '6fbe05_f31478b537df4d42926e7bb5b3cfd42d',
      '6fbe05_54f02a55461c472c812ea0a6f03fa9b7',
      '6fbe05_c801f2ca30ef4a6987727b2bc92eeb1d',
      '6fbe05_c0140da266ef46f3b1ecdd2116c8eaef',
      '6fbe05_005f68b7147348ceba8938a205903ee4',
      '6fbe05_f2a9a77634f04c28860d08fe80e294f8',
      '6fbe05_fec6057dcdc346bca2855a65c533a433',
    ],
  },
  {
    slug: 'maternity',
    name: 'Maternity',
    description: 'Soft, timeless portraits that honor the season of waiting and becoming.',
    hasGallery: true,
    legacyImages: [
      '6fbe05_a4fd0f80537845caa5be07bccd87256b',
      '6fbe05_c4df86b2a036458f92eea5287fd65ba1',
      '6fbe05_0001652a7c354f9f9ccb8ce8c0358033',
      '6fbe05_47f66569525840ba94e076ff76599319',
      '6fbe05_586bac3b867e4505a824b734b5d81105',
      '6fbe05_002131e1517d40f89da299aa90301ee9',
      '6fbe05_6ae3204388504a55aaeeda32c3b96cf0',
      '6fbe05_e3242644b81643058e261d508b9c4799',
      '6fbe05_9bb381c3b36d41909a9548f8b5ca0299',
      '6fbe05_03f5f58bb338447d8d25ef63c6e0dca5',
      '6fbe05_32b6f7f35d1f46b5861edad4cc050185',
      '6fbe05_85181e246ac840de8c1eaf81785fc6f8',
    ],
  },
  {
    slug: 'family',
    name: 'Family',
    description: 'Candid, unposed connection between the people who matter most to you.',
    hasGallery: true,
    legacyImages: [
      '6fbe05_fdc0019e1a8c4b1ca791900281b04dd0',
      '6fbe05_cdf3cd89d9e544838f0721fa54cc24ea',
      '6fbe05_f3e0065c088e44d49143c031416e6924',
      '6fbe05_33a88e772c6946f28a2b59ad6951aff4',
      '6fbe05_7c9a01b6de9842f9ba9a7ea111434996',
      '6fbe05_32ae3bf20a0c463a97dd4038605b05df',
      '6fbe05_b304b81a9b7d4189aa6c70546ec356be',
      '6fbe05_b93fab7f7dca4d95851feab64a9324a1',
      '6fbe05_5843c4b6693c466ba8be80ed49f1a326',
      '6fbe05_6dfe6312e8f14c0b8dcb87304aef2ea4',
      '6fbe05_420898994d5a4161b64b7d6bb2dda612',
      '6fbe05_151a58c9b8d446e0bdd5e7a30321b49d',
    ],
  },
  {
    slug: 'seniors',
    name: 'Seniors',
    description: 'Confident, editorial portraits to mark the milestone.',
    hasGallery: true,
    legacyImages: [
      '6fbe05_aae8b8f8a5a1464e87f93d9bfd70dbe0',
      '6fbe05_60c9a3b5c81f407a8f38c21ad0460e78',
      '6fbe05_0e36a0a99553452b9d5046e6cd49a232',
      '6fbe05_543ad97037cd44b2ae4271bb3c995953',
      '6fbe05_da27a9ab1ff240ef9d178c5f97ca6430',
      '6fbe05_88e8f4bf56404c6d9f6f640fe2496161',
      '6fbe05_a8f590fd54274489b7113377762c6f58',
      '6fbe05_775715f1ea8f44029120dba619d61a16',
      '6fbe05_19a98db4136347f0abf188d0279f5f08',
      '6fbe05_955539ea3e3447308baf3624fa82b9ce',
      '6fbe05_e17ce631c9de4662897c8168e88a47f5',
      '6fbe05_4ef68c8400a94646a77670273ac8c80a',
    ],
  },
  {
    slug: 'grads',
    name: 'Grads',
    description: 'Celebrating the achievement, in the places that made it happen.',
    hasGallery: true,
    legacyImages: [
      '6fbe05_00e49855785a4a5bbe259e133315bc8b',
      '6fbe05_790ac33004364bc19a95a451b00962bc',
      '6fbe05_88c4a8b1fbb9435c824b777c655cd825',
      '6fbe05_afda2c3dc5164c959d8af7d54a54b9d3',
      '6fbe05_541322ba13a841578a0bf5320fa271f2',
      '6fbe05_9ec9e2616c67451887f30e591f8383a4',
      '6fbe05_5cacf829a38547268b7258498606776e',
      '6fbe05_adc9a0b67e18424fb73977e6a845eba8',
      '6fbe05_45bef0a783e64d998f5a736a116434d0',
      '6fbe05_9013141f5bc34bad81277f499e89e2e9',
      '6fbe05_3872671962a74695ada1584936521dc9',
      '6fbe05_324ef1ec8c7a4b3080c031e192ce016a',
    ],
  },
  {
    slug: 'events',
    name: 'Events',
    description: 'Every gathering worth remembering, documented as it unfolds.',
    hasGallery: false,
    legacyImages: ['6fbe05_ceed89b57ca64d328f61d1d785ad89e2'],
  },
]

/**
 * Category for photos used only in featured placements (e.g. Aspen's own
 * portrait). Not in PORTFOLIO_CATEGORIES, so these never appear in a gallery
 * or category tile.
 */
export const SITE_ONLY_CATEGORY = { slug: 'site', name: 'Site only (not in portfolio)' } as const

export function getPortfolioCategory(slug: string): PortfolioCategory | undefined {
  return PORTFOLIO_CATEGORIES.find(c => c.slug === slug)
}
