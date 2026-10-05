<template>
    <v-dialog
      v-model="dialog"
      fullscreen
      scrollable
      transition="dialog-bottom-transition"
    >
      <v-card color="surface" rounded="0">
        <v-toolbar color="ivory-deep" density="comfortable">
            <v-btn
                icon="mdi-close"
                color="stone"
                aria-label="Close without saving"
                :disabled="loading"
                @click="dialog = false"
            ></v-btn>
            <v-toolbar-title>
                <span class="font-display text-h5 text-charcoal">{{ item?.productId ? 'Edit' : 'New' }} Session</span>
            </v-toolbar-title>
            <div class="d-flex align-center ga-2 pr-4">
                <v-btn
                  class="font-nav tracking-wide text-caption d-none d-sm-flex" rounded="0"
                  variant="text"
                  color="stone"
                  :disabled="loading"
                  @click="dialog = false"
                >
                  Cancel
                </v-btn>
                <v-btn
                  color="charcoal"
                  class="font-nav tracking-wide text-caption" rounded="0"
                  variant="flat"
                  :disabled="loading"
                  @click="onSave"
                >
                  Save
                </v-btn>
            </div>
        </v-toolbar>
        <v-divider color="stone-light" />
        <v-card-text class="pa-0">
            <v-container v-if="loading" class="fill-height">
              <v-row align="center" justify="center">
                <v-col cols="auto" class="text-center">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    :size="70"
                    :width="5"
                  ></v-progress-circular>
                  <div class="mt-5 font-display text-h5 text-charcoal">
                    Loading, please wait..
                  </div>
                </v-col>
              </v-row>
            </v-container>

            <!-- Capped width so fields stay a readable length on big screens; two columns keep it to one screen -->
            <v-container v-else class="session-form py-6 py-md-8">
              <v-row>
                <v-col cols="12" md="6" class="pr-md-6">
                  <span class="section-label">Details</span>
                  <v-row dense>
                    <v-col cols="12" sm="8">
                      <v-text-field
                        v-model="form.name"
                        label="Name"
                        v-bind="fieldProps"
                        hint="Shown as the session title, e.g. Classic Portrait.">
                      </v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model.number="form.sortOrder"
                        label="Sort order"
                        type="number"
                        v-bind="fieldProps"
                        hint="Lower numbers are listed first.">
                      </v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="form.serialNumber"
                        label="URL slug"
                        prefix="/booking/"
                        v-bind="fieldProps"
                        hint="Changing it breaks existing links."
                        persistent-hint>
                      </v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-combobox
                        v-model="form.collection"
                        :items="collections"
                        label="Investment section"
                        v-bind="fieldProps"
                        hint="Sessions are grouped under this heading, e.g. Portraits.">
                      </v-combobox>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model.number="form.price"
                        label="Price"
                        type="number"
                        min="0"
                        prefix="$"
                        v-bind="fieldProps"
                        hide-details="auto">
                      </v-text-field>
                      <v-checkbox
                        v-model="form.priceFrom"
                        label="Starting price ($400+)"
                        density="compact"
                        color="charcoal"
                        hide-details
                        class="price-from">
                      </v-checkbox>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="form.durationMinutes"
                        :items="durationOptions"
                        label="Duration"
                        v-bind="fieldProps"
                        hint="Clients can only book times the whole session fits into.">
                      </v-select>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="form.portfolioCategory"
                        :items="categoryOptions"
                        item-title="name"
                        item-value="slug"
                        label="Category"
                        clearable
                        v-bind="fieldProps"
                        hint="Default cover, and the Contact form topic.">
                      </v-select>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="form.location"
                        label="Location"
                        v-bind="fieldProps"
                        hint="e.g. Tallahassee, FL area — location of your choice">
                      </v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-switch
                        v-model="form.isBookable"
                        color="charcoal"
                        inset
                        density="compact"
                        hide-details>
                        <template #label>
                          <span class="text-charcoal">Bookable online</span>
                          <span class="text-caption text-stone ml-2">
                            {{ form.isBookable ? 'Clients choose a time on the calendar' : 'Clients are sent to the Contact page (e.g. weddings)' }}
                          </span>
                        </template>
                      </v-switch>
                    </v-col>
                  </v-row>
                </v-col>

                <v-col cols="12" md="6" class="pl-md-6">
                  <span class="section-label">Page content</span>
                  <v-row dense>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.description"
                        label="Description"
                        rows="7"
                        no-resize
                        v-bind="fieldProps"
                        hint="Leave a blank line between paragraphs. The first paragraph is the summary on the Investment page.">
                      </v-textarea>
                    </v-col>
                    <v-col cols="12">
                      <v-combobox
                        v-model="form.features"
                        label="What's included"
                        multiple
                        chips
                        closable-chips
                        v-bind="fieldProps"
                        hint="Type an item and press Enter, e.g. 50+ edited images.">
                      </v-combobox>
                    </v-col>
                    <v-col cols="12">
                      <CoverPhotoPicker v-model="form.coverPhotoId" :portfolio-category="form.portfolioCategory" />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CoverPhotoPicker from '@/components/Admin/CoverPhotoPicker.vue'
import { PORTFOLIO_CATEGORIES } from '@/utils/portfolioCategories'
import { formatDuration } from '@/utils/bookingFormat'

const props = defineProps(['open', 'loading', 'item', 'collections'])
const emit = defineEmits(['close', 'save'])

/** Shared look for every field; hints show on focus so the form fits on one screen */
const fieldProps = {
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
  'base-color': 'stone',
  rounded: '0',
} as const

const categoryOptions = PORTFOLIO_CATEGORIES
const durationOptions = Array.from({ length: 24 }, (_, i) => (i + 1) * 30)
  .map(minutes => ({ title: formatDuration(minutes), value: minutes }))

/** A session: the product's name, slug, description and price, plus its session details */
function emptyForm() {
  return {
    productId: null,
    name: '',
    description: '',
    serialNumber: '',
    price: null as number | null,
    priceFrom: false,
    durationMinutes: 60,
    location: '',
    collection: '',
    features: [] as string[],
    portfolioCategory: null as string | null,
    coverPhotoId: null as string | null,
    sortOrder: 0,
    isBookable: true,
  }
}

const form = ref(emptyForm())

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
    form.value = emptyForm()
  }
}, {
  immediate: true
})

watch(() => props.item, (newValue: any) => {
  if(newValue){
    const session = props.item?.session
    form.value = {
      ...emptyForm(),
      productId: props.item?.productId ?? null,
      name: props.item?.name ?? '',
      description: props.item?.description ??'',
      serialNumber: props.item?.serialNumber ??'',
      price: props.item?.price ?? null,
      priceFrom: props.item?.priceTypeId === 2,
      ...(session && {
        durationMinutes: session.durationMinutes,
        location: session.location ?? '',
        collection: session.collection,
        features: session.features ?? [],
        portfolioCategory: session.portfolioCategory,
        coverPhotoId: session.coverPhotoId,
        sortOrder: session.sortOrder,
        isBookable: session.isBookable,
      }),
    }
  }
}, {
  immediate: true
})

function onSave(){
  emit('save', form.value)
}
</script>
<style scoped>
.session-form {
  max-width: 1200px;
}

.section-label {
  display: block;
  font-family: var(--font-nav);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-blush));
  margin-bottom: 0.75rem;
}

.price-from {
  margin-top: -2px;
}

.price-from :deep(.v-label) {
  font-size: 0.8125rem;
}
</style>
