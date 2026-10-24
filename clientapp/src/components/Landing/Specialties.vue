<template>
  <v-sheet color="ivory-deep">
    <v-container class="py-16 py-md-16">
      <div class="text-center mb-12 mb-md-16">
        <!-- <span class="font-nav tracking-widest text-caption text-blush">What I Shoot</span> -->
        <h2 class="font-heading text-charcoal specialties-heading mt-4">Specialties</h2>
      </div>

      <v-row class="specialties-row">
        <v-col v-for="item in specialties" :key="item.title" cols="12" md="4">
          <router-link :to="`/portfolio/${item.slug}`" class="text-decoration-none specialty-link">
            <PlacementPhoto
              :placement="item.placement"
              :sizes="PHOTO_SIZES.specialty"
              class="specialty-image mb-6"
            />

            <div class="text-center">
              <h3 class="font-heading text-charcoal specialty-title mb-0">{{ item.title }}</h3>
            </div>
          </router-link>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import PlacementPhoto from '@/components/Photo/PlacementPhoto.vue'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const specialties = [
  {
    title: 'Weddings',
    slug: 'weddings',
    placement: 'home-specialty-weddings',
  },
  {
    title: 'Maternity',
    slug: 'maternity',
    placement: 'home-specialty-maternity',
  },
  {
    title: 'Family',
    slug: 'family',
    placement: 'home-specialty-family',
  },
]
</script>

<style scoped>
.specialties-heading {
  font-size: clamp(2.25rem, 2.5vw + 1.25rem, 3rem);
}

/* Keeps the three cards at a reasonable size on big screens, centered as a
   group instead of stretching to the container's full width */
@media (min-width: 1400px) {
  .specialties-row {
    max-width: 1320px;
    margin-inline: auto;
  }
}

/* Stacked on small screens: don't let one card fill a whole tablet */
.specialty-link {
  display: block;
  max-width: 420px;
  margin-inline: auto;
}

.specialty-image {
  transition: transform 0.5s ease;
}

.specialty-image:hover {
  transform: translateY(-4px);
}

.specialty-title {
  font-size: 1.75rem;
}
</style>
