<template>
  <v-sheet color="ivory-deep">
    <v-container class="py-16 py-md-16">
      <div class="text-center mb-12 mb-md-16">
        <span class="font-nav tracking-widest text-caption text-blush">What I Shoot</span>
        <h2 class="font-display text-charcoal specialties-heading mt-4">Specialties</h2>
      </div>

      <v-row>
        <v-col v-for="(item, i) in specialties" :key="item.title" cols="12" md="4">
          <v-img
            :src="item.image"
            aspect-ratio="0.8"
            cover
            class="specialty-image mb-6"
          ></v-img>

          <div class="text-center">
            <span class="font-display font-italic text-blush specialty-index">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <h3 class="font-display text-charcoal specialty-title my-2">{{ item.title }}</h3>
            <p class="font-display font-italic text-stone specialty-copy">{{ item.copy }}</p>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import { portfolioPhoto } from '@/utils/portfolioPhotos'

const specialties = [
  {
    title: 'Weddings',
    copy: 'From quiet getting-ready moments to the last dance, documented with an editorial eye.',
    image: portfolioPhoto('bridePortrait', 700, 875),
  },
  {
    title: 'Maternity',
    copy: 'Soft, timeless portraits that honor the season of waiting and becoming.',
    image: portfolioPhoto('maternityAnnouncement', 700, 875),
  },
  {
    title: 'Family',
    copy: 'Candid, unposed connection between the people who matter most to you.',
    image: portfolioPhoto('familyLittleBrother', 700, 875),
  },
]
</script>

<style scoped>
.specialties-heading {
  font-size: clamp(2.25rem, 2.5vw + 1.25rem, 3rem);
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
