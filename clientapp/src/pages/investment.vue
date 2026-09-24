<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <Hero />

  <PricingSection title="Portraits" tone="ivory" :tiers="portraitTiers" />
  <PricingSection title="Maternity" tone="ivory-deep" :tiers="maternityTiers" />
  <PricingSection title="Seniors & Grads" tone="ivory" :tiers="seniorTiers" />

  <Cta />
</template>

<script lang="ts" setup>
import Hero from '@/components/Investment/Hero.vue'
import PricingSection, { type PricingTier } from '@/components/Investment/PricingSection.vue'
import Cta from '@/components/Investment/Cta.vue'

const portraitTiers: PricingTier[] = [
  {
    name: 'Mini Portrait',
    price: '$150',
    description: 'Perfect for holiday cards, headshots, & small children.',
    features: ['30 minutes', '1 location', '20 edited images', 'Online Gallery', '1 outfit'],
  },
  {
    name: 'Classic Portrait',
    price: '$250',
    description: 'Includes couples, engagements, & family.',
    features: ['60 minutes', '1 location', '50+ edited images', 'Online Gallery', '1 outfit'],
  },
]

const maternityTiers: PricingTier[] = [
  {
    name: 'Classic Maternity',
    price: '$300',
    features: [
      '90 minutes',
      '1 location',
      '50+ edited images',
      'Online Gallery',
      '2 outfits',
      'Props at request',
      'Client closet (if applicable)',
    ],
  },
  {
    name: 'Maternity Package',
    price: '$500',
    features: [
      'Approximately 3 hours',
      '2 locations',
      '100+ edited images',
      'Online Gallery',
      '2-3 outfits',
      'Classic Maternity & In-home Newborn',
      'Client closet (if applicable)',
    ],
  },
]

const seniorTiers: PricingTier[] = [
  {
    name: 'Classic',
    price: '$300',
    features: ['60 minutes', '2 locations', '50+ edited images', 'Online Gallery', '2 outfits'],
  },
  {
    name: 'Package',
    price: '$400+',
    description: 'Ideal for groups. Inquire for add-on options and pricing.',
    features: [
      'Minimum 2 hours',
      'Minimum 2 locations',
      '75+ edited images',
      'Online Gallery',
      'Minimum 2 outfits',
    ],
  },
]
</script>
