<template>
    <v-sheet color="background" class="pb-3">
        <v-container v-if="loading" class="mt-3">
            <v-row align="center" justify="center">
                <v-col cols="auto" class="text-center">
                <v-progress-circular
                    indeterminate
                    color="primary"
                    :size="70"
                    :width="5"
                ></v-progress-circular>
                <div class="mt-5 text-h5 text-lightest-slate">
                    Searching, please wait..
                </div>
                </v-col>
            </v-row>
        </v-container>
        <v-container v-else>
            <template v-if="!productDetails">
                <div class="d-flex flex-column align-center py-12 text-center">
                    <v-icon size="40" class="mb-3 text-lightest-navy">mdi-package-variant-closed</v-icon>
                    <p class="text-body-2 text-slate">Search for a product by serial number to view its details.</p>
                </div>
            </template>
            <template v-else>
                <v-row>
                    <v-col cols="12">
                        <div class="d-flex align-center flex-wrap ga-3 mb-2">
                            <v-chip v-if="productDetails.serialNumber" size="small" variant="outlined" color="slate" class="font-mono">
                                SN: {{ productDetails.serialNumber }}
                            </v-chip>
                            <v-chip v-if="productDetails.grade" size="small" variant="outlined" color="violet" class="font-mono">
                                {{ productDetails.grade }}
                            </v-chip>
                        </div>
                        <h2 class="text-lightest-slate text-h4 font-weight-bold mb-3">{{ productDetails.name }}</h2>
                        <p class="text-slate">{{ productDetails.description }}</p>
                        <p v-if="productImages?.length" class="font-mono text-caption text-slate text-uppercase mt-6 mb-3">
                            {{ productImages.length }} photo{{ productImages.length === 1 ? '' : 's' }}
                        </p>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col v-for="(url, index) in productImages" :key="index" cols="6" md="3">
                        <v-card color="surface" rounded="lg" class="product-image-card" @click="viewImage(url)">
                            <v-img
                                :src="url"
                                :height="!$vuetify.display.mobile ? '300px' : '150px'"
                                cover
                                :aspect-ratio="1"
                                class="bg-light-navy">
                                <template v-slot:placeholder>
                                    <v-row
                                        align="center"
                                        class="fill-height ma-0"
                                        justify="center"
                                    >
                                        <v-progress-circular
                                        color="primary"
                                        indeterminate
                                        ></v-progress-circular>
                                    </v-row>
                                </template>
                            </v-img>
                        </v-card>
                    </v-col>
                </v-row>
            </template>
        </v-container>
    </v-sheet>

    <v-dialog
      v-model="dialog"
      transition="dialog-bottom-transition"
      fullscreen
    >
        <v-card color="navy">
            <v-toolbar color="navy">
                <v-btn
                    icon="mdi-close"
                    color="lightest-slate"
                    :disabled="loading"
                    @click="closeImage"
                ></v-btn>
                <v-toolbar-title>
                    <span class="font-mono text-subtitle-1 text-lightest-slate text-uppercase">{{ productDetails?.name ?? "Product Image" }}</span>
                </v-toolbar-title>

                <v-btn
                    :disabled="loading"
                    :href="selectedImage"
                    target="_blank"
                    color="primary"
                    icon
                >
                    <v-icon>mdi-download</v-icon>
                </v-btn>
            </v-toolbar>
            <v-img
                :src="selectedImage"
                height="100%"
                cover
                :aspect-ratio="1"
                class="bg-light-navy">
                <template v-slot:placeholder>
                    <v-row
                        align="center"
                        class="fill-height ma-0"
                        justify="center"
                    >
                        <v-progress-circular
                        color="primary"
                        indeterminate
                        ></v-progress-circular>
                    </v-row>
                </template>
            </v-img>
        </v-card>
    </v-dialog>
</template>
  
<script setup lang="ts">
import { ref, computed } from 'vue'
  
const props = defineProps(['product', 'images', 'loading'])

const productDetails = computed(() => props.product)
const productImages = computed(() => props.images)

const dialog = ref(false)
const selectedImage = ref()

function viewImage(url: string){
    dialog.value = true
    selectedImage.value = url
}

function closeImage(){
    dialog.value = false
    selectedImage.value = null
}

</script>

<style scoped>
.product-image-card {
    cursor: pointer;
    border: 1px solid rgb(var(--v-theme-lightest-navy));
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.product-image-card:hover {
    transform: translateY(-4px);
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 16px 24px -14px rgba(2, 12, 27, 0.7);
}
</style>
  