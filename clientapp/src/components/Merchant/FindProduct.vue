<template>
    <section class="bg-light-navy">
      <v-container class="py-10">
        <v-row>
            <v-col>
                <p class="font-mono text-primary text-body-2 mb-2">
                    <span aria-hidden="true">&gt;</span> merchant.robsmitha.com
                </p>
                <div class="text-lightest-slate text-h4 font-weight-bold">
                    Find a Product
                </div>
                <span class="text-slate">
                    Search for a product using the Serial Number
                </span>
            </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-text-field
                v-model="search"
                append-inner-icon="mdi-magnify"
                label="Search"
                hint="Enter your product's serial number"
                variant="outlined"
                color="primary"
                base-color="slate"
                class="font-mono"
                persistent-hint
                :readonly="loading"
                :loading="loading"
                clearable
                @click:clear="emit('clear')"
                @click:append-inner="emit('search', search)"
                @keypress.enter="emit('search', search)"
                rounded="lg"
            ></v-text-field>

            <!-- <v-btn
              class="mt-3"
              variant="tonal"
              :disabled="loading"
              :block="$vuetify.display.mobile"
              @click="emit('search', search)">
              Search
            </v-btn> -->
          </v-col>
        </v-row>
      </v-container>
    </section>
  </template>
  
  <script setup lang="ts">
  import { computed, watch } from 'vue'
  
  const props = defineProps(['loading', 'term'])
  const emit = defineEmits(['search', 'clear', 'input'])
  
  const search = computed({
    get() {
      return props.term
    },
    set(newValue) {
      emit('input', newValue)
    }
  })
  
  watch(search, async (newSearch: string) => {
      if(!newSearch || newSearch.length === 0){
          emit('clear')
      }
  })
  </script>
  