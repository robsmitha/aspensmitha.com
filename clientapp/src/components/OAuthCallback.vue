<template>
    <v-sheet color="background" class="d-flex align-center justify-center oauth-screen">
        <v-container>
            <v-row>
                <v-col md="6" offset-md="3" cols="12" class="text-center">
                    <h1 class="text-lightest-slate text-h5 font-weight-bold mb-6">{{ message }}</h1>
                    <v-progress-linear
                        v-if="loading"
                        color="primary"
                        bg-color="lightest-navy"
                        indeterminate
                        rounded
                    ></v-progress-linear>
                </v-col>
            </v-row>
        </v-container>
    </v-sheet>
</template>

<style scoped>
.oauth-screen {
    min-height: 60vh;
}
</style>

<script lang="ts" setup>
import { ref, watch} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from "@/store/auth"

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const message = ref('Requesting access token..')
const loading = ref(true)

const code = route.query['code']?.toString()
const state = route.query['state']?.toString()
if (code && state) {
    auth.requestGitHubAccessToken(code, state)
        .then(_ => {
            router.push('/code')
            message.value = "Successfully retreived GitHub Access Token!"
        })
        .catch(_ => {
            message.value = "There was a problem getting the access token. Please try again."
            loading.value = false
        })
} else {
    message.value = "There was a problem with your request. Please try again."
    loading.value = false
}
</script>
