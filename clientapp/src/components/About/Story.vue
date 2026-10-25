<template>
  <v-container class="py-10 py-md-16">
    <v-row>
      <v-col cols="12" md="5">
        <ResponsivePhoto
          :photo="photos.forPlacement('about-story')"
          :sizes="PHOTO_SIZES.portrait"
          aspect-ratio="0.8"
          class="story-image"
        />
      </v-col>

      <!-- One column of text beside the photo, so it reads as a single block -->
      <v-col cols="12" md="6" offset-md="1">
        <v-icon color="blush" size="32" class="d-flex mb-6">mdi-format-quote-open</v-icon>

        <p class="font-display text-charcoal story-copy mb-6">
          Hey there! I’m Aspen, a {{ aspenAge }}-year-old stay-at-home mom to my
          {{ sonAge }}-year-old son, wife to my best friend of {{ yearsTogetherPhrase }}, and cat
          mom to Zeus, Jasper, and Athena. When I’m not behind the camera, you’ll probably find
          us exploring a nearby park or working on our ever-growing list of home renovations.
        </p>

        <p class="font-display text-charcoal story-copy mb-6">
          My love for storytelling began long before photography. Through journalism club,
          yearbook, and countless photoshoots with my friends and little brother, I discovered
          the joy of capturing moments and turning them into something meaningful. When I
          received my first camera for Christmas in 2020, that passion quickly grew into
          something more.
        </p>

        <p class="font-display text-charcoal story-copy mb-6">
          Motherhood has shaped my perspective in ways I never could have imagined. Our eldest
          son, Beckham, was born at 24 weeks and spent 105 days in the NICU. Our second son,
          Lincoln, arrived at just 21 weeks, and heartbreakingly, we were unable to bring him
          home. Both of my boys are my greatest inspiration, reminding me to cherish the
          fleeting moments and pursue the things that matter most.
        </p>

        <p class="font-display text-charcoal story-copy">
          Photography has become more than just taking pictures. It’s about preserving memories,
          celebrating life, and telling the stories that make us who we are. Whether your story
          is filled with profound joy, heartbreaking loss, or a little of both, I hope to help
          you hold onto it&mdash;one photograph at a time.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const photos = usePhotoStore()
// Not a reserved CDN placement, so this still reads /api/portfolio (load() shares one request)
photos.load()

function calculateAge(birthYear: number, birthMonth: number, birthDay: number): number {
  const now = new Date()
  let age = now.getFullYear() - birthYear
  if (now.getMonth() < birthMonth - 1 || (now.getMonth() === birthMonth - 1 && now.getDate() < birthDay)) {
    age -= 1
  }
  return age
}

const aspenAge = calculateAge(2002, 2, 25)
const sonAge = calculateAge(2021, 11, 18)

// Together since December 1, 2020. Reads "nearly six years" in the months
// leading up to an anniversary and "six years" in the months after it.
const numberWords = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
]
const today = new Date()
const monthsTogether = (today.getFullYear() - 2020) * 12 + today.getMonth() - 11
const fullYears = Math.floor(monthsTogether / 12)
const nearly = monthsTogether % 12 >= 6
const shownYears = nearly ? fullYears + 1 : Math.max(fullYears, 1)
const yearsWord = numberWords[shownYears - 1] ?? String(shownYears)
const yearsTogetherPhrase = `${nearly ? 'nearly ' : ''}${yearsWord} year${shownYears === 1 ? '' : 's'}`
</script>

<style scoped>
.story-image {
  /* Stops growing with the column on big screens; centered when stacked */
  max-width: 500px;
  margin-inline: auto;
  box-shadow: 0 24px 60px -20px rgba(33, 31, 28, 0.3);
}

/* Side by side: hug the text column instead of floating in the gutter */
@media (min-width: 960px) {
  .story-image {
    margin-right: 0;
  }
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

</style>
