<template>
    <div>
        <UnDraw />
        <br>
        <v-icon>mdi-alert-circle</v-icon>
        {{message}}
    </div>
</template>

<script setup lang="ts">

defineProps({
    message: { 
        type: String
    }
})

</script>