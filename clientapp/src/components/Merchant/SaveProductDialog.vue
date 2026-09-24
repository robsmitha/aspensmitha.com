<template>
    <v-dialog
      v-model="dialog"
      scrollable
      transition="dialog-bottom-transition"
      :fullscreen="false"
    >
      <v-card color="surface">
        <v-toolbar color="light-navy">
            <v-toolbar-title>
                <span class="font-weight-bold text-lightest-slate">{{ item?.productId ? 'Modify' : 'New' }} Product</span>
            </v-toolbar-title>
            <v-btn
                icon="mdi-close"
                color="slate"
                :disabled="loading"
                @click="dialog = false"
            ></v-btn>
        </v-toolbar>
        <v-divider color="lightest-navy" />
        <v-card-text class="pa-0">
            <template v-if="loading">
              <v-container class="fill-height">
                <v-row align="center" justify="center">
                  <v-col cols="auto" class="text-center">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      :size="70"
                      :width="5"
                    ></v-progress-circular>
                    <div class="mt-5 text-h5 text-lightest-slate">
                      Loading, please wait..
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </template>
            <template v-else>
                <v-container fluid>
                  <v-row>
                    <v-col>
                      <v-text-field
                        v-model="form.name"
                        label="Name"
                        required
                        variant="outlined"
                        color="primary"
                        base-color="slate"
                        class="font-mono"
                        hint="Use a recognizable name for the product.">
                      </v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.serialNumber"
                        label="Serial Number"
                        variant="outlined"
                        color="primary"
                        base-color="slate"
                        class="font-mono"
                        hint="Products must have a unique serial number."
                        required>
                      </v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.grade"
                        label="Grade"
                        variant="outlined"
                        color="primary"
                        base-color="slate"
                        class="font-mono"
                        hint="Enter the grade of the product.">
                      </v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <v-textarea
                        v-model="form.description"
                        label="Enter note"
                        variant="outlined"
                        color="primary"
                        base-color="slate"
                        class="font-mono"
                        auto-grow
                        rows="3"
                        hint="Generic notes about this product. You can add notes after the product is created.">
                      </v-textarea>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col class="pt-0">
                      <span class="font-mono text-primary text-caption text-uppercase d-block mb-2">Images</span>
                      <v-divider color="lightest-navy" />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <v-file-input
                        v-model="form.files"
                        label="Add Files"
                        counter
                        multiple
                        show-size
                        clearable
                        variant="outlined"
                        color="primary"
                        base-color="slate"
                        chips
                        hint="Add pictures of the product. These will display on the site when searched by serial number."
                        persistent-hint
                      ></v-file-input>
                    </v-col>
                  </v-row>
                  <v-row v-if="form.images?.length > 0">
                    <v-col>
                      <v-chip
                          v-for="i in form.images"
                          :key="i.productImageId"
                          class="mr-2 mb-2 font-mono"
                          closable
                          variant="outlined"
                          color="primary"
                          @click:close="onDeleteImage(i.productImageId)"
                        >
                        {{ i.fileName }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-container>
            </template>
        </v-card-text>

        <v-divider color="lightest-navy" />
        <v-card-actions class="my-2 d-flex justify-end">
            <v-btn
              class="font-mono text-none"
              variant="text"
              color="slate"
              @click="dialog = false"
            >
              Cancel
            </v-btn>

            <v-btn
              color="primary"
              class="font-mono text-none"
              variant="outlined"
              :disabled="loading"
              @click="onSave"
            >
              Save
            </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps(['open', 'loading', 'item'])
const emit = defineEmits(['close', 'save', 'delete-image'])

const form = ref({
  productId: null,
  name: '',
  description: '',
  serialNumber: '',
  grade: '',
  images: [] as any,
  files: [] as File[]
})

const dialog = computed({
  get() {
    return props.open
  },
  set(newValue) {
    if(!newValue) {
        emit('close')
    }
  }
})
watch(() => props.open, (newValue: any) => {
  if(!newValue){
    form.value = {
      productId: null,
      name: '',
      description: '',
      serialNumber: '',
      grade: '',
      images: [] as any,
      files: [] as File[]
    }
  }
}, {
  immediate: true
})

watch(() => props.item, (newValue: any) => {
  if(newValue){
    form.value = {
      productId: props.item?.productId ?? null,
      name: props.item?.name ?? '',
      description: props.item?.description ??'',
      serialNumber: props.item?.serialNumber ??'',
      grade: props.item?.grade ?? '',
      images: props.item?.images ?? [] as any,
      files: [] as File[]
    }
  }
}, {
  immediate: true
})

function onSave(){
  emit('save', form.value)
}

function onDeleteImage(productImageId: number){
  const updatedImages = form.value.images.filter((i: any) => i.productImageId !== productImageId);
  form.value.images = updatedImages
  emit('delete-image', productImageId)
}
</script>