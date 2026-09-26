<template>
  <v-container class="py-10 py-md-16">
    <v-row>
      <v-col cols="12" md="5">
        <ResponsivePhoto
          :photo="photos.forPlacement('about-story')"
          :sizes="PHOTO_SIZES.fiveTwelfths"
          aspect-ratio="0.8"
          class="story-image"
        />
      </v-col>

      <v-col cols="12" md="6" offset-md="1">
        <p class="font-display text-charcoal story-copy mb-6">
          Hey there! My name is Aspen, and I'm a 23 year-old stay-at-home mom, caring for my 3
          year-old snack bandit. My husband and I will celebrate our fifth year together in
          December. We have three cats; Zeus, Jasper, and Athena, and a French Bulldog named
          Hazel. When I'm not working on my photography business, we're most likely to be
          walking as a family around the nearby park or completing tasks on the ever-growing
          list of to-dos for our renovated house.
        </p>

        <p class="font-display text-charcoal story-copy mb-6">
          From my earliest memories, I had a passion to create and share stories with the
          world. My storytelling journey took various forms throughout the years. Through
          avenues like journalism club and yearbook class, I honed my skills in crafting
          compelling narratives and capturing moments that mattered.
        </p>

        <p class="font-display text-charcoal story-copy mb-6">
          It was when I got my hands on my mom's camera that my love for photography began to
          take root. I'd bring it with me on trips to capture the landscape and wildlife, had
          endless photoshoots with friends, and made my little brother my very own model
          (older sibling love at its finest).
        </p>

        <p class="font-display text-charcoal story-copy">
          Christmas of 2020 I was gifted my very own camera and two Christmases ago my husband
          bought me a new one! My gear collection has multiplied and my love for photography
          has grown beyond just taking pictures. I love scouting for new locations, connecting
          with my clients, editing images to perfection, and of course &mdash; telling your
          story.
        </p>
      </v-col>
    </v-row>

  </v-container>

  <!-- A wider, full-bleed pull-quote band for the most personal part of the
       story. Wider than the old narrow centered column so the same text
       takes less scroll, but kept as one flowing column — a left-to-right
       reader's eye doesn't naturally split a screen into two texts to read
       side by side, so two columns here felt disjointed rather than wide. -->
  <v-sheet color="ivory-deep" class="py-14 py-md-20">
    <v-container>
      <div class="quote-block">
        <v-icon color="blush" size="32" class="d-flex mb-8 mb-md-10">mdi-format-quote-open</v-icon>

        <p class="font-display text-charcoal story-copy mb-6">
          The journey of motherhood has been both a profound and emotional one for me. Our
          eldest son, Beckham, was born prematurely at 24 weeks, and spent 105 days in the TMH
          NICU. Our second son, Lincoln, arrived even earlier at 21 weeks, and we were
          heartbreakingly unable to bring him home. These experiences have made me cherish
          every moment and instilled even more of a desire to capture life's fleeting moments
          through my camera. Both of my sons are my inspiration. They've taught me to never
          take life for granted, to seize every moment, and to gather the courage to pursue my
          dream of starting my own photography business. Through them, I've discovered the
          incredible power of photography to preserve memories, celebrate life, and tell the
          stories that matter most.
        </p>

        <p class="font-display text-charcoal story-copy">
          I hope to have the opportunity to tell your story, whether it's filled with moments
          of profound joy or heart wrenching sadness. Life is woven with threads of varying
          shades and textures, and it's in the diverse experiences and emotions that our
          stories truly come to life. I aim to capture the essence of your journey, preserving
          the moments that define it, so you can hold onto them for a lifetime. Each
          photograph becomes a chapter in your unique story, and I can't wait to help you tell
          it, one image at a time.
        </p>
      </div>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const photos = usePhotoStore()
</script>

<style scoped>
.story-image {
  box-shadow: 0 24px 60px -20px rgba(33, 31, 28, 0.3);
}

/* Upright (not italic) serif at a standard reading size — long italic
   paragraphs are hard on the eyes, so italic is reserved for short accents
   elsewhere (eyebrows, marks) and this body copy stays plain and legible. */
.story-copy {
  font-weight: 400;
  font-size: clamp(1.0625rem, 0.25vw + 1rem, 1.1875rem);
  line-height: 1.8;
  letter-spacing: 0.01em;
}

.quote-block {
  max-width: 780px;
  margin-inline: auto;
}
</style>
