<template>
  <v-sheet :color="tone" class="py-14 py-md-20">
    <v-container>
      <div class="d-flex align-center mb-10 mb-md-14 section-heading">
        <h2 class="font-display text-charcoal section-title text-nowrap">{{ title }}</h2>
        <v-divider class="ml-6 flex-grow-1" color="stone-light" opacity="0.8" thickness="1"></v-divider>
      </div>

      <v-row>
        <v-col v-for="tier in tiers" :key="tier.name" cols="12" :md="12 / tiers.length">
          <v-sheet color="surface" border rounded="0" class="pricing-card pa-8 pa-md-10 h-100">
            <span class="font-nav tracking-widest text-caption text-blush">{{ title }}</span>
            <h3 class="font-display text-charcoal tier-name mt-2 mb-4">{{ tier.name }}</h3>

            <div class="d-flex align-baseline ga-1 mb-4">
              <span class="font-display text-charcoal tier-price">{{ tier.price }}</span>
            </div>

            <p v-if="tier.description" class="font-display font-italic text-stone tier-description mb-6">
              {{ tier.description }}
            </p>

            <v-divider color="stone-light" opacity="0.6" class="mb-6"></v-divider>

            <ul class="tier-features">
              <li v-for="feature in tier.features" :key="feature" class="d-flex align-start ga-3 mb-3">
                <v-icon color="blush" size="16" class="mt-1">mdi-check</v-icon>
                <span class="font-display font-italic text-charcoal">{{ feature }}</span>
              </li>
            </ul>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
export interface PricingTier {
  name: string
  price: string
  description?: string
  features: string[]
}

defineProps<{
  title: string
  tiers: PricingTier[]
  tone?: 'ivory' | 'ivory-deep'
}>()
</script>

<style scoped>
.section-title {
  font-size: clamp(1.75rem, 2vw + 1rem, 2.5rem);
}

.pricing-card {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.pricing-card:hover {
  box-shadow: 0 24px 48px -24px rgba(33, 31, 28, 0.25);
  transform: translateY(-4px);
}

.tier-name {
  font-size: clamp(1.5rem, 1.5vw + 1rem, 1.875rem);
  line-height: 1.15;
}

.tier-price {
  font-size: clamp(2.25rem, 2vw + 1.5rem, 3rem);
  line-height: 1;
}

.tier-description {
  font-size: 1.0625rem;
  line-height: 1.5;
}

.tier-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tier-features span {
  font-size: 1.0625rem;
  line-height: 1.4;
}
</style>
