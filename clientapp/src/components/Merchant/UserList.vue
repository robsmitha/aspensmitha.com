<template>
    <v-sheet color="background">
    <v-container>
        <v-row class="mt-3">
            <v-col>
                <ContentHeader
                    overline="Access Control"
                    title="Users"
                    :subtitle="`${items?.length ?? 0} user${(items?.length ?? 0) === 1 ? '' : 's'}`"
                />
            </v-col>
            <v-col class="text-right">
                <v-btn variant="outlined" color="primary" class="font-mono text-none" disabled @click="dialog = true" :icon="$vuetify.display.mobile">
                    <v-icon>mdi-plus</v-icon> <span v-if="!$vuetify.display.mobile">New</span>
                </v-btn>
            </v-col>
        </v-row>
        <v-divider class="mt-4 mb-8" thickness="4" length="48" color="primary" />
        <v-row>
            <v-col>
                <v-card color="surface" rounded="lg" class="bordered-card">
                    <v-data-table
                        :headers="headers"
                        :items="items"
                        :custom-filter="filter"
                        :search="search"
                        item-value="userName"
                    >
                        <template v-slot:top>
                            <v-container>
                                <v-row>
                                    <v-col>
                                        <v-text-field
                                            v-model="search"
                                            prepend-inner-icon="mdi-magnify"
                                            label="Filter"
                                            hint="Search all active users."
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
                                <v-icon size="40" class="mb-3 text-lightest-navy">mdi-account-group-outline</v-icon>
                                <p class="text-body-2 text-slate">No users to display.</p>
                            </div>
                        </template>
                        <template v-slot:[`item.identityProvider`]="{ item }">
                            <v-chip size="small" variant="outlined" color="slate" class="font-mono">{{ item.identityProvider }}</v-chip>
                        </template>
                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn size="small" color="primary" icon variant="text" @click="editUser(item)">
                                <v-icon>mdi-key-variant</v-icon>
                            </v-btn>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
    </v-sheet>
    <v-dialog v-model="dialog" persistent max-width="800">
        <v-card color="surface">
            <v-card-title class="d-flex justify-space-between align-center">
                <div class="text-h5 text-lightest-slate ps-2">
                    {{ selectedUser?.userName }} <span class="font-mono text-body-2 text-slate">({{ selectedUser?.identityProvider }})</span>
                </div>

                <v-btn
                    icon="mdi-close"
                    variant="text"
                    color="slate"
                    @click="dialog = false"
                ></v-btn>
            </v-card-title>
            <v-divider color="lightest-navy" />
            <v-card-text>
                <v-row>
                    <v-col v-for="resource in resources" :key="resource" md="6" cols="12" class="mb-2">
                        <p class="font-mono text-primary text-caption text-uppercase mb-2">{{ resource[0].toUpperCase() + resource.slice(1) }}</p>
                        <v-switch
                            v-for="action in actions"
                            :key="action"
                            :label="capitalize(action)"
                            color="primary"
                            :model-value="getPolicy(resource, action)"
                            @update:model-value="val => setPolicy(resource, action, val)"
                            hide-details
                            density="compact"
                        />
                    </v-col>
                </v-row>
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
                  class="font-mono text-none"
                  color="primary"
                  variant="outlined"
                  @click="saveAccessPolicy"
                >
                  Save
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import elysianClient from '@/api/elysianClient'

interface User {
    userName: string,
    userId: number,
    identityProvider: string,
    accessControl: AccessControl
}

interface SaveAccessPolicyCommand {
    userId: number,
    accessControl: AccessControl
}

interface AccessControl {
    policies: string[]
}


const items = ref<User[]>([])

const headers = [
    { title: 'UserName', key: 'userName' },
    { title: 'Login', key: 'identityProvider' },
    { title: 'Roles', key: 'accessControl.roles' },
    { title: 'Permissions', key: 'accessControl.policies' },
    { title: '', sortable: false, key: 'actions' }
]
const resources = ['user', 'product', 'budget', 'code', 'income'];
const actions = ['read', 'write', 'delete'];

const loading = ref(false)
const dialog = ref(false)
const selectedUser = ref<User | null>(null)
const search = ref('')
const snackbar = ref(false)
const errorMessage = ref('')

onMounted(() => {
    getUsers()
})

const getPolicy = (resource: string, action: string) => {
  return selectedUser.value?.accessControl.policies.includes(`${resource}.${action}`) || false;
};

const setPolicy = (resource: string, action: string, value: boolean | null) => {
  setPolicies(value, `${resource}.${action}`);
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

function filter (value: string, query: string, item: any) {
    const upperCaseQuery = query.toLocaleUpperCase()
    return value != null &&
        upperCaseQuery != null &&
        typeof value === 'string' &&
        value.toString().toLocaleUpperCase().indexOf(upperCaseQuery) !== -1
}

function setPolicies(value: boolean | null, key: string) {
    if (!selectedUser.value) {
        return
    }

    const policies = selectedUser.value.accessControl.policies
    const index = policies.indexOf(key)
    if (value && index === -1) {
      policies.push(key)
    } else if (!value && index !== -1) {
      policies.splice(index, 1)
    }
}

function editUser(user: User) {
    dialog.value = true
    selectedUser.value = user
}

async function getUsers(): Promise<void> {
    loading.value = true
    const response = await elysianClient?.getData(`/api/Users`);
    if (!response.success) {
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
    } else {
        items.value = response.data;
    }
    loading.value = false;

}

async function saveAccessPolicy(): Promise<void> {
    loading.value = true
    const request: SaveAccessPolicyCommand = {
        userId: selectedUser.value!.userId,
        accessControl: selectedUser.value!.accessControl
    }

    const response = await elysianClient?.postData(`/api/SaveAccessPolicy`, request);

    if (!response?.success){
        if(response.errorMessage){
            errorMessage.value = response.errorMessage
        } else {
            errorMessage.value = 'An error occurred. Please try again later.'
        }
        snackbar.value = true
    } else {
        await getUsers()
    }


    loading.value = false
    dialog.value = false
    selectedUser.value = null
}
</script>

<style scoped>
.bordered-card {
    border: 1px solid rgb(var(--v-theme-lightest-navy));
}
</style>
