<template>
    <v-container class="py-10 py-md-14">
        <AdminPageHeader
            eyebrow="Booking"
            title="Sessions"
            :subtitle="`${items.length} session${items.length === 1 ? '' : 's'} on the Investment and booking pages`"
        >
            <template #actions>
                <v-btn
                    variant="outlined"
                    color="charcoal"
                    rounded="0"
                    class="font-nav tracking-wide text-caption"
                    prepend-icon="mdi-plus"
                    @click="$emit('create')"
                >
                    New Session
                </v-btn>
            </template>
        </AdminPageHeader>
        <v-row>
            <v-col>
                <v-card color="surface" rounded="0" flat class="bordered-card">
                    <v-data-table
                        :headers="headers"
                        :items="items"
                        :search="search"
                        :loading="loading"
                        :items-per-page="-1"
                        item-value="productId"
                        hover
                        class="session-table">
                        <template v-slot:top>
                            <div class="pa-4">
                                <v-text-field
                                    v-model="search"
                                    prepend-inner-icon="mdi-magnify"
                                    label="Filter"
                                    hint="Search by name, section or slug. Sessions are listed in sort order."
                                    persistent-hint
                                    clearable
                                    variant="outlined"
                                    color="primary"
                                    base-color="stone"
                                    rounded="0"
                                >
                                </v-text-field>
                            </div>
                        </template>
                        <!-- Every session fits on one page, so no pagination footer -->
                        <template v-slot:bottom></template>
                        <template v-slot:loading>
                            <v-skeleton-loader type="table-row@6" color="surface"></v-skeleton-loader>
                        </template>
                        <template v-slot:no-data>
                            <div class="d-flex flex-column align-center py-10">
                                <v-icon size="40" class="mb-3 text-stone-light">mdi-camera-outline</v-icon>
                                <p class="text-body-2 text-stone">No sessions yet.</p>
                            </div>
                        </template>

                        <!-- The whole row opens the session for editing; the menu holds everything else -->
                        <template v-slot:item="{ item, columns }">
                            <tr class="session-row" tabindex="0" @click="$emit('edit', item.productId)" @keydown.enter.self="$emit('edit', item.productId)">
                                <td v-for="column in columns" :key="column.key ?? ''" :class="column.align === 'end' ? 'text-end' : ''">
                                    <template v-if="column.key === 'title'">
                                        <div class="py-3">
                                            <span class="d-block font-nav tracking-widest text-caption text-blush text-uppercase">{{ item.collection }}</span>
                                            <span class="d-block font-display text-charcoal session-name">{{ item.title }}</span>
                                            <span class="d-block font-mono text-caption text-stone">/booking/{{ item.slug }}</span>
                                        </div>
                                    </template>
                                    <span v-else-if="column.key === 'durationMinutes'" class="text-charcoal">{{ formatDuration(item.durationMinutes) }}</span>
                                    <span v-else-if="column.key === 'price'" class="text-charcoal">{{ formatPrice(item) }}</span>
                                    <v-chip
                                        v-else-if="column.key === 'isBookable'"
                                        size="small"
                                        rounded="0"
                                        variant="tonal"
                                        :color="item.isBookable ? 'success' : 'stone'"
                                        class="font-nav"
                                    >
                                        {{ item.isBookable ? 'Bookable online' : 'Inquiry only' }}
                                    </v-chip>
                                    <v-menu v-else-if="column.key === 'actions'" location="bottom end">
                                        <template v-slot:activator="{ props: menuProps }">
                                            <v-btn
                                                v-bind="menuProps"
                                                icon="mdi-dots-horizontal"
                                                variant="text"
                                                size="small"
                                                color="stone"
                                                :aria-label="`Actions for ${item.title}`"
                                                @click.stop
                                                @keydown.enter.stop
                                            ></v-btn>
                                        </template>
                                        <v-list density="compact" rounded="0" min-width="200" class="py-1">
                                            <v-list-item prepend-icon="mdi-pencil-outline" @click="$emit('edit', item.productId)">
                                                <v-list-item-title class="font-nav text-body-2">Edit</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item prepend-icon="mdi-open-in-new" @click="$emit('view', item.slug)">
                                                <v-list-item-title class="font-nav text-body-2">View on site</v-list-item-title>
                                            </v-list-item>
                                            <v-divider class="my-1" color="stone-light" />
                                            <v-list-item prepend-icon="mdi-delete-outline" base-color="error" @click="$emit('delete', item)">
                                                <v-list-item-title class="font-nav text-body-2">Delete</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { useDisplay } from 'vuetify'
import AdminPageHeader from '@/components/Admin/AdminPageHeader.vue'
import type { BookingSession } from '@/store/sessions'
import { formatDuration, formatPrice } from '@/utils/bookingFormat'

type ReadonlyHeaders = VDataTable['$props']['headers']

withDefaults(defineProps<{
    items: BookingSession[]
    loading?: boolean
}>(), {
    loading: false,
})

defineEmits<{
    create: []
    edit: [productId: number]
    view: [slug: string]
    delete: [session: BookingSession]
}>()

const search = ref('')
const { mobile } = useDisplay()

const headers = computed<ReadonlyHeaders>(() => mobile.value
    ? [
        { title: 'Session', key: 'title', value: (s: BookingSession) => `${s.title} ${s.collection} ${s.slug}`, sortable: false },
        { title: '', key: 'actions', sortable: false, align: 'end' },
    ]
    : [
        { title: 'Session', key: 'title', value: (s: BookingSession) => `${s.title} ${s.collection} ${s.slug}`, sortable: false },
        { title: 'Duration', key: 'durationMinutes', sortable: false },
        { title: 'Price', key: 'price', sortable: false },
        { title: 'Online booking', key: 'isBookable', sortable: false },
        { title: '', key: 'actions', sortable: false, align: 'end' },
    ])
</script>

<style scoped>
.bordered-card {
    border: 1px solid rgba(var(--v-theme-charcoal), 0.1);
}

.session-row {
    cursor: pointer;
}

.session-row:focus-visible {
    outline: 2px solid rgb(var(--v-theme-blush));
    outline-offset: -2px;
}

.session-name {
    font-size: 1.25rem;
    line-height: 1.25;
}

.session-table :deep(th) {
    font-family: var(--font-nav);
    font-size: 0.75rem !important;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgb(var(--v-theme-stone));
}
</style>
