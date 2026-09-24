<template>
    <v-breadcrumbs :items="breadcrumbs" class="px-4 pt-4 font-mono text-caption"></v-breadcrumbs>
    <ProductList
        :items="products"
        @view="viewProduct"
        @edit="editProduct"
        @delete="deleteProduct"
        @create="dialog = true"
    />
    <SaveProductDialog
        :open="dialog"
        :loading="loading"
        :item="selectedProduct"
        @close="dialog = false"
        @save="saveProduct"
        @delete-image="deleteProductImage"
    />

    <v-dialog
        v-model="snackbar"
        :max-width="500"
    >
        <v-card color="surface">
            <v-card-title class="d-flex justify-space-between align-center">
                <div>
                    <v-icon color="error" size="small">mdi-alert</v-icon>
                    <span class="ml-2 text-lightest-slate">Request Failed</span>
                </div>

                <v-btn
                  icon="mdi-close"
                  variant="text"
                  color="slate"
                  @click="snackbar = false"
                ></v-btn>
              </v-card-title>
              <v-divider color="lightest-navy" />
              <v-card-text class="pt-2 text-slate">
                {{ errorMessage }}
              </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BlobServiceClient } from '@azure/storage-blob'
import apiClient from '@/api/elysianClient'

const breadcrumbs = [
    {
    title: 'HOME',
    disabled: false,
    to: '/',
  },
  {
    title: 'PRODUCTS',
    disabled: true
  }
]

const router = useRouter()
const dialog = ref(false)
const loading = ref(false)
const selectedProduct = ref<any | undefined>()
const snackbar = ref(false)
const errorMessage = ref('')

const products = ref([])

onMounted(() => {
    getProducts()
})

watch(dialog, (newValue) => {
    if(!newValue){
        selectedProduct.value = undefined
    }
})

async function getProducts(){
    const response = await apiClient.getData('/api/GetProducts')
    
    if(!response.success){
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
    }

    products.value = response.data
}

function viewProduct(serialNumber: string) {
    router.push(`/search/${serialNumber}`)
}

async function editProduct(productId: number) {
    loading.value = true
    dialog.value = true

    const response = await apiClient.getData(`/api/GetProduct?productId=${productId}`)
    if(!response.success){
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
    }

    const data = response.data
    selectedProduct.value = {
        productId: data.product.productId,
        name: data.product.name,
        description: data.product.description,
        serialNumber: data.product.serialNumber,
        grade: data.product.grade,
        images: data.images
    }
    loading.value = false
}

async function deleteProduct(productId: number) {
    const response = await apiClient.postData('/api/DeleteProduct', { productId })
    
    if(!response.success){
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
    }

    if (response.data.success) {
        await getProducts()
    }
}

async function deleteProductImage(productImageId: number){
    loading.value = true
    const response = await apiClient.postData('/api/DeleteProductImage', { productImageId })
    
    if(!response.success){
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
    }
    loading.value = false

    if (!response.data.success) {
        errorMessage.value = 'Could not delete product'
        snackbar.value = true
    }
}

async function uploadFile(file: File) {
    const response = await apiClient.getData(`/api/GenerateSasToken?fileName=${file.name}`)
    
    if(!response.success){
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
        return null
    }

    const data = response.data

    const blobServiceClient = new BlobServiceClient(`https://${data.accountName}.blob.core.windows.net?${data.sasToken}`);
    
    const containerClient = blobServiceClient.getContainerClient(data.containerName);
    
    const blockBlobClient = containerClient.getBlockBlobClient(data.blobName);
    await blockBlobClient.uploadData(file);
    return {
        fileName: file.name,
        fileSize: file.size,
        storageId: data.folderId
    }
}

async function saveProduct(form: any) {
    loading.value = true
    const images: any = []
    for(let i = 0; i < form.files.length; i++) {
        const image = await uploadFile(form.files[i])
        image && images.push(image)
    }
    const response = await apiClient.postData('/api/SaveProduct', {
        productId: form.productId,
        name: form.name,
        description: form.description,
        serialNumber: form.serialNumber,
        grade: form.grade,
        addImages: images
    })
    
    if(!response.success){
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
        loading.value = false
        return
    }
    selectedProduct.value = undefined
    loading.value = false
    dialog.value = false

    if (response.data.productId) {
        await getProducts()
    }
}
</script>
  