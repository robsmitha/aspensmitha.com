<template>
  <v-sheet color="grey-lighten-4" class="py-3">
    <v-container>
      <v-row>
        <v-col cols="12">
          <template v-if="!page">
            <v-skeleton-loader
              type="article"
              color="transparent"
            ></v-skeleton-loader>
            <v-skeleton-loader
              v-for="i in 2"
              :key="i"
              type="paragraph"
              color="transparent"
            ></v-skeleton-loader>
          </template>
          <template v-else>
            <v-card color="transparent" flat>
              <v-card-title>
                <span class="text-h4" v-html="page.title"></span>
              </v-card-title>
              <v-card-text>
                <span v-html="page.content"></span>
              </v-card-text>
            </v-card>
          </template>
        </v-col>
        <!-- <v-col md="4" cols="12"  class="d-flex justify-center align-center">
          <v-img 
            :width="300"
            aspect-ratio="4/3"
            cover
            src="https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/unDraw/undraw_barbecue_3x93.svg">
          </v-img>
        </v-col> -->
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from "@/store/app";
import { storeToRefs } from 'pinia'

const appStore = useAppStore();
const { aboutPage } = storeToRefs(appStore)
const page = ref(aboutPage)
</script>
