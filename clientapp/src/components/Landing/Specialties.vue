<template>
  <v-sheet color="ivory-deep">
    <v-container class="py-16 py-md-16">
      <div class="text-center mb-12 mb-md-16">
        <!-- <span class="font-nav tracking-widest text-caption text-blush">What I Shoot</span> -->
        <h2 class="font-display text-charcoal specialties-heading mt-4">Specialties</h2>
      </div>

      <v-row class="specialties-row">
        <v-col v-for="(item, i) in specialties" :key="item.title" cols="12" md="4">
          <router-link :to="`/portfolio/${item.slug}`" class="text-decoration-none specialty-link">
            <ResponsivePhoto
              :photo="photos.forPlacement(item.placement)"
              :sizes="PHOTO_SIZES.specialty"
              aspect-ratio="0.8"
              class="specialty-image mb-6"
            />

            <div class="text-center">
              <span class="font-display font-italic text-blush specialty-index">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <h3 class="font-display text-charcoal specialty-title my-2">{{ item.title }}</h3>
              <p class="font-display font-italic text-stone specialty-copy">{{ item.copy }}</p>
            </div>
          </router-link>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const photos = usePhotoStore()

const specialties = [
  {
    title: 'Weddings',
    slug: 'weddings',
    copy: 'From quiet getting-ready moments to the last dance, documented with an editorial eye.',
    placement: 'home-specialty-weddings',
  },
  {
    title: 'Maternity',
    slug: 'maternity',
    copy: 'Soft, timeless portraits that honor the season of waiting and becoming.',
    placement: 'home-specialty-maternity',
  },
  {
    title: 'Family',
    slug: 'family',
    copy: 'Candid, unposed connection between the people who matter most to you.',
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

.specialty-index {
  font-size: 1rem;
  letter-spacing: 0.08em;
}

.specialty-title {
  font-size: 1.75rem;
}

.specialty-copy {
  font-size: 1.125rem;
  line-height: 1.5;
  max-width: 340px;
  margin-inline: auto;
}
</style>
