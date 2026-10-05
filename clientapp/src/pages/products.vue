<route lang="yaml">
meta:
  layout: admin
</route>

<template>
    <ProductList
        :items="sessions.sessions"
        :loading="!sessions.loaded"
        @view="viewSession"
        @edit="editSession"
        @delete="confirmDelete"
        @create="dialog = true"
    />
    <SaveProductDialog
        :open="dialog"
        :loading="loading"
        :item="selectedProduct"
        :collections="collections"
        @close="dialog = false"
        @save="saveSession"
    />

    <v-dialog v-model="deleteDialog" max-width="460">
        <v-card color="surface" rounded="0">
            <v-card-title class="font-display text-h5 text-charcoal pt-6 px-6">Delete {{ sessionToDelete?.title }}?</v-card-title>
            <v-card-text class="px-6 text-body-2 text-charcoal-light">
                It will be removed from the Investment and booking pages. Bookings already on your calendar aren't affected.
            </v-card-text>
            <v-card-actions class="px-6 pb-5 d-flex justify-end">
                <v-btn class="font-nav tracking-wide text-caption" rounded="0" variant="text" color="stone" :disabled="deleting" @click="deleteDialog = false">
                    Cancel
                </v-btn>
                <v-btn class="font-nav tracking-wide text-caption" rounded="0" variant="flat" color="error" :loading="deleting" @click="deleteSession">
                    Delete
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog
        v-model="snackbar"
        :max-width="500"
    >
        <v-card color="surface" rounded="0">
            <v-card-title class="d-flex justify-space-between align-center">
                <div class="font-display">
                    <v-icon color="error" size="small">mdi-alert</v-icon>
                    <span class="ml-2 text-charcoal">Request Failed</span>
                </div>

                <v-btn
                  icon="mdi-close"
                  variant="text"
                  color="stone"
                  @click="snackbar = false"
                ></v-btn>
              </v-card-title>
              <v-divider color="stone-light" />
              <v-card-text class="pt-2 text-stone">
                {{ errorMessage }}
              </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue'
import apiClient from '@/api/elysianClient'
import ProductList from '@/components/Merchant/ProductList.vue'
import SaveProductDialog from '@/components/Merchant/SaveProductDialog.vue'
import { useSessionStore, type BookingSession } from '@/store/sessions'

/** Elysian's ProductTypes and PriceTypes: every product on this site is a bookable session */
const SESSION_PRODUCT_TYPE = 2
const PRICE_TYPE = { fixed: 1, variable: 2 } as const

const sessions = useSessionStore()
const collections = computed(() => sessions.collections.map(c => c.name))

const dialog = ref(false)
const loading = ref(false)
const selectedProduct = ref<any | undefined>()
const snackbar = ref(false)
const errorMessage = ref('')

const deleteDialog = ref(false)
const deleting = ref(false)
const sessionToDelete = ref<BookingSession | null>(null)

// Always fresh here, so edits show up straight away
onMounted(() => sessions.reload())

watch(dialog, (newValue) => {
    if(!newValue){
        selectedProduct.value = undefined
    }
})

function showError(message: string | undefined) {
    errorMessage.value = message || 'An error occurred. Please try again later.'
    snackbar.value = true
}

function viewSession(slug: string) {
    window.open(`/booking/${encodeURIComponent(slug)}`, '_blank', 'noopener')
}

async function editSession(productId: number) {
    loading.value = true
    dialog.value = true

    const response = await apiClient.getData(`/api/GetProduct?productId=${productId}`)
    if(!response.success){
        loading.value = false
        dialog.value = false
        showError(response.errorMessage)
        return
    }

    const data = response.data
    selectedProduct.value = {
        productId: data.product.productId,
        name: data.product.name,
        description: data.product.description,
        serialNumber: data.product.serialNumber,
        price: data.product.price,
        priceTypeId: data.product.priceTypeId,
        session: data.session
    }
    loading.value = false
}

function confirmDelete(session: BookingSession) {
    sessionToDelete.value = session
    deleteDialog.value = true
}

async function deleteSession() {
    if (!sessionToDelete.value) return
    deleting.value = true
    const response = await apiClient.postData('/api/DeleteProduct', { productId: sessionToDelete.value.productId })
    deleting.value = false
    deleteDialog.value = false

    if(!response.success || !response.data?.success){
        showError(response.errorMessage ?? 'Could not delete the session.')
        return
    }
    await sessions.reload()
}

async function saveSession(form: any) {
    loading.value = true
    const response = await apiClient.postData('/api/SaveProduct', {
        productId: form.productId,
        name: form.name,
        description: form.description ?? '',
        serialNumber: form.serialNumber.trim(),
        grade: '',
        addImages: [],
        productTypeId: SESSION_PRODUCT_TYPE,
        priceTypeId: form.priceFrom ? PRICE_TYPE.variable : PRICE_TYPE.fixed,
        price: typeof form.price === 'number' ? form.price : null,
        session: {
            durationMinutes: form.durationMinutes,
            location: form.location,
            collection: form.collection ?? '',
            features: form.features,
            portfolioCategory: form.portfolioCategory,
            coverPhotoId: form.coverPhotoId,
            sortOrder: Number(form.sortOrder) || 0,
            isBookable: form.isBookable,
        }
    })

    if(!response.success){
        loading.value = false
        showError(response.errorMessage)
        return
    }
    selectedProduct.value = undefined
    loading.value = false
    dialog.value = false

    await sessions.reload()
}
</script>
