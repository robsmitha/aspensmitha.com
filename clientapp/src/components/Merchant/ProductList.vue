<template>
    <v-sheet color="background">
    <v-container>
        <v-row class="mt-3">
            <v-col>
                <ContentHeader
                    overline="Merchant"
                    title="Products"
                    :subtitle="`${items?.length ?? 0} product${(items?.length ?? 0) === 1 ? '' : 's'} in catalog`"
                />
            </v-col>
            <v-col class="text-right">
                <v-btn
                    variant="outlined"
                    color="primary"
                    class="font-mono text-none"
                    :icon="$vuetify.display.mobile"
                    @click="$emit('create')"
                >
                    <v-icon>mdi-plus</v-icon> <span v-if="!$vuetify.display.mobile">New</span>
                </v-btn>
            </v-col>
        </v-row>
        <v-divider class="mt-4 mb-8" thickness="4" length="48" color="primary" />
        <v-row>
            <v-col>
                <v-card color="surface" rounded="lg" class="bordered-card">
                    <v-data-table
                        :custom-filter="filter"
                        :headers="headers"
                        :items="items"
                        :search="search"
                        item-value="name">
                        <template v-slot:top>
                            <v-container>
                                <v-row>
                                    <v-col>
                                        <v-text-field
                                            v-model="search"
                                            prepend-inner-icon="mdi-magnify"
                                            label="Filter"
                                            hint="Search all active products."
                                            persistent-hint
                                            clearable
                                            variant="outlined"
                                            color="primary"
                                            base-color="slate"
                                            class="font-mono"
                                            rounded="lg"
                                        >
                                        </v-text-field>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </template>
                        <template v-slot:loading>
                            <v-skeleton-loader type="table-row@12" color="surface"></v-skeleton-loader>
                        </template>
                        <template v-slot:no-data>
                            <div class="d-flex flex-column align-center py-10">
                                <v-icon size="40" class="mb-3 text-lightest-navy">mdi-package-variant</v-icon>
                                <p class="text-body-2 text-slate">No products to display.</p>
                            </div>
                        </template>
                        <template v-slot:item="{ item }">
                            <tr>
                                <td v-for="header in headers" :key="header.key">
                                    <template v-if="header.key === ''">
                                        <v-btn variant="text" size="small" color="primary" icon @click="$emit('view', item?.serialNumber)">
                                            <v-icon>
                                                mdi-eye
                                            </v-icon>
                                        </v-btn>
                                        <v-btn variant="text" size="small" color="primary" icon @click="$emit('edit', item?.productId)">
                                            <v-icon>
                                                mdi-pencil
                                            </v-icon>
                                        </v-btn>
                                        <v-btn variant="text" size="small" color="error" icon @click="$emit('delete', item?.productId)">
                                            <v-icon>
                                                mdi-delete
                                            </v-icon>
                                        </v-btn>
                                    </template>
                                    <template v-else-if="header.key === 'grade'">
                                        <v-chip v-if="item.grade" size="small" variant="outlined" color="violet" class="font-mono">
                                            {{ item.grade }}
                                        </v-chip>
                                    </template>
                                    <template v-else-if="header.key === 'serialNumber'">
                                        <span class="font-mono text-slate">{{ item.serialNumber }}</span>
                                    </template>
                                    <template v-else-if="header.key === 'createdAt'">
                                        <span class="font-mono text-caption text-slate">{{ dateFilter(getNestedValue(item, header.key)) }}</span>
                                    </template>
                                    <template v-else>
                                        {{ getNestedValue(item, header.key!.toString()) }}
                                    </template>
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
    </v-sheet>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
import { useDateFilter } from '@/filters/dateFilter'

const { dateFilter } = useDateFilter()

type ReadonlyHeaders = VDataTable['$props']['headers']

const props = defineProps({
    items: { type: Array<any> }
})
const emit = defineEmits(['view', 'create', 'delete', 'edit'])
const search = ref('')

const isMobile = computed(() => mobile.value);

const headers: ReadonlyHeaders = isMobile.value
    ? [
        {
            title: 'Name',
            key: 'name',
        },
        {
            title: 'Serial #',
            key: 'serialNumber',
        },
        {
            title: '',
            key: '',
            sortable: false,
            align: 'end'
        }
    ]
    : [
        {
            title: 'Name',
            key: 'name',
        },
        {
            title: 'Serial #',
            key: 'serialNumber',
        },
        {
            title: 'Grade',
            key: 'grade',
        },
        {
            title: 'Description',
            key: 'description'
        },
        {
            title: 'Created',
            key: 'createdAt'
        },
        {
            title: '',
            key: '',
            sortable: false,
            align: 'end'
        }
    ]

function filter (value: string, query: string, item: any) {
    const upperCaseQuery = query.toLocaleUpperCase()
    return value != null &&
        upperCaseQuery != null &&
        typeof value === 'string' &&
        value.toString().toLocaleUpperCase().indexOf(upperCaseQuery) !== -1
}

function getNestedValue(obj: any, key: string) {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
}
</script>

<style scoped>
.bordered-card {
    border: 1px solid rgb(var(--v-theme-lightest-navy));
}
</style>
