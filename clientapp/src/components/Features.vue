<template>
    <v-sheet id="features" color="background" class="py-16">
        <v-container>
            <div class="d-flex align-center mb-4 section-heading">
                <span class="font-mono text-primary text-h6 mr-3">02.</span>
                <h2 class="text-lightest-slate text-h4 font-weight-bold text-nowrap">
                    Live Demos
                </h2>
                <v-divider class="ml-6 flex-grow-1" color="lightest-navy" thickness="1"></v-divider>
            </div>
            <p class="text-slate mb-12 features-intro">
                Don't write code? No problem &mdash; explore a handful of working features
                I've built and shipped on this site.
            </p>
        </v-container>

        <template v-for="(f, i) in enabledFeatures" :key="f.title">
            <v-container>
                <v-row justify="space-between" :class="{ 'flex-md-row-reverse': i % 2 === 1 }">
                    <v-col md="7" cols="12" class="d-flex flex-column justify-center">
                        <div class="d-flex align-center ga-4 mb-3">
                            <span class="font-mono text-h4 font-weight-bold feature-index" :class="`text-${f.accent}`">
                                {{ String(i + 1).padStart(2, '0') }}
                            </span>
                            <v-divider vertical :color="f.accent" class="feature-index-divider"></v-divider>
                            <span class="font-mono text-body-2" :class="`text-${f.accent}`">
                                {{ f.subtitle }}
                            </span>
                        </div>

                        <h3 class="text-lightest-slate text-h5 font-weight-bold mb-4">
                            {{ f.title }}
                        </h3>

                        <p class="text-slate">
                            {{ f.text }}
                        </p>

                        <div>
                            <v-btn
                                class="mt-6 font-mono text-none"
                                variant="outlined"
                                :color="f.accent"
                                :to="f.to"
                            >
                             Explore
                             <v-icon end>mdi-arrow-right-thin</v-icon>
                            </v-btn>
                        </div>
                    </v-col>

                    <v-col v-if="!isMobile" md="5" cols="12" class="d-flex justify-center align-center">
                        <v-sheet color="surface" rounded="lg" border class="feature-media d-flex flex-column pa-0 overflow-hidden">
                            <div class="feature-media-bar" :class="`bg-${f.accent}`"></div>
                            <div class="d-flex align-center justify-center pa-8 flex-grow-1">
                                <v-img
                                    :width="220"
                                    aspect-ratio="4/3"
                                    :src="f.image">
                                </v-img>
                            </div>
                        </v-sheet>
                    </v-col>
                </v-row>
            </v-container>
            <v-container v-if="i < enabledFeatures.length - 1">
                <v-divider color="lightest-navy" class="my-12"></v-divider>
            </v-container>
        </template>
    </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const features = [
    {
        title: 'Congress Activity',
        subtitle: 'CapitolSharp.Congress',
        text: 'Stay informed with a dynamic feed showcasing the latest updates, actions, and activities from Congress in real-time.',
        to: '/congress',
        icon: 'mdi-rss',
        image: 'https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/unDraw/undraw_text-files_tqjw.svg',
        accent: 'primary',
        enabled: true
    },
    {
        title: 'Generate Code',
        subtitle: 'NJsonSchema.CodeGeneration',
        text: 'Easily generate fully-structured C# and TypeScript Data Transfer Objects (DTOs) directly from JSON, streamlining your development process.',
        to: '/generate-code',
        icon: 'mdi-rocket-launch-outline',
        image: 'https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/unDraw/undraw_data-processing_z2q6.svg',
        accent: 'info',
        enabled: true
    },
    {
        title: 'US Bill Tracker',
        subtitle: 'CapitolSharp.Congress',
        text: 'Access a comprehensive, pageable dataset containing detailed records of all US bills, enabling easy navigation and in-depth research.',
        to: '/bills',
        icon: 'mdi-radar',
        image: 'https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/unDraw/undraw_text-files_tqjw.svg',
        accent: 'amber',
        enabled: false
    },
    {
        title: 'Search Code',
        subtitle: 'GitHub Rest API',
        text: 'Explore and search code hosted at github.com/robsmitha effortlessly using specific keywords and a flexible, customizable query syntax to refine your results.',
        to: '/code',
        icon: 'mdi-magnify',
        image: 'https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/unDraw/undraw_read-notes_7itt.svg',
        accent: 'violet',
        enabled: true
    }
    // TODO: Budget Features
]

const enabledFeatures = computed(() => features.filter(f => f.enabled))
</script>

<style scoped>
.features-intro {
  max-width: 640px;
}

.feature-index {
  font-variant-numeric: tabular-nums;
  opacity: 0.9;
}

.feature-index-divider {
  height: 28px;
  opacity: 0.5;
}

.feature-media-bar {
  height: 4px;
  width: 100%;
}

.feature-media {
  width: 100%;
  min-height: 220px;
}
</style>
