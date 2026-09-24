<template>
    <v-img :width="width" :src="src" />
</template>

<script setup lang="ts">
import { svgs } from './UnDraw';
import { computed } from 'vue';
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const props = defineProps({
  svg: { type: String }
})

const width = computed(() => isMobile.value ? 200 : 300)

const src = computed(() => {
    const baseUrl = 'https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/vendor/unDraw/'
    switch(props.svg){
        case undefined:
        case null: 
        case '':
        return baseUrl + svgs[Math.floor(Math.random() * svgs.length)] + ".svg"
    }
    return baseUrl + props.svg + ".svg"
})
</script>