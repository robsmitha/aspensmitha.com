<template>
    <v-container class="py-10 py-md-14">
        <AdminPageHeader
            eyebrow="Access Control"
            title="Users"
            :subtitle="`${items?.length ?? 0} user${(items?.length ?? 0) === 1 ? '' : 's'}`"
        />
        <v-row>
            <v-col>
                <v-card color="surface" rounded="0" flat class="bordered-card">
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
                                            base-color="stone"
                                            rounded="0"
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
                                <v-icon size="40" class="mb-3 text-stone-light">mdi-account-group-outline</v-icon>
                                <p class="text-body-2 text-stone">No users to display.</p>
                            </div>
                        </template>
                        <template v-slot:[`item.identityProvider`]="{ item }">
                            <v-chip size="small" variant="outlined" color="stone" class="font-nav">{{ item.identityProvider }}</v-chip>
                        </template>
                        <template v-slot:[`item.accessControl.roles`]="{ item }">
                            <div class="d-flex flex-wrap ga-1 py-2">
                                <v-chip
                                    v-for="role in item.accessControl.roles"
                                    :key="role"
                                    size="small"
                                    variant="tonal"
                                    color="blush"
                                    class="font-nav"
                                >{{ role }}</v-chip>
                            </div>
                        </template>
                        <template v-slot:[`item.accessControl.policies`]="{ item }">
                            <div class="py-2">
                                <div v-for="group in groupPolicies(item.accessControl.policies)" :key="group.resource" class="policy-line">
                                    <span class="font-nav tracking-wide text-caption text-charcoal text-uppercase policy-resource">{{ group.resource }}</span>
                                    <span class="text-caption text-stone text-no-wrap">{{ group.actions.join(' · ') }}</span>
                                </div>
                            </div>
                        </template>
                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn size="small" color="charcoal" icon variant="text" @click="editUser(item)">
                                <v-icon>mdi-key-variant</v-icon>
                            </v-btn>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
    <v-dialog v-model="dialog" persistent max-width="800">
        <v-card color="surface" rounded="0">
            <v-card-title class="d-flex justify-space-between align-center">
                <div class="font-display text-h5 text-charcoal ps-2">
                    {{ selectedUser?.userName }} <span class="font-nav text-body-2 text-stone">({{ selectedUser?.identityProvider }})</span>
                </div>

                <v-btn
                    icon="mdi-close"
                    variant="text"
                    color="stone"
                    @click="dialog = false"
                ></v-btn>
            </v-card-title>
            <v-divider color="stone-light" />
            <v-card-text>
                <v-row>
                    <v-col v-for="resource in resources" :key="resource" md="6" cols="12" class="mb-2">
                        <p class="font-nav tracking-widest text-blush text-caption text-uppercase mb-2">{{ resource[0].toUpperCase() + resource.slice(1) }}</p>
                        <v-switch
                            v-for="action in actions"
                            :key="action"
                            :label="capitalize(action)"
                            color="blush"
                            :model-value="getPolicy(resource, action)"
                            @update:model-value="val => setPolicy(resource, action, val)"
                            hide-details
                            density="compact"
                        />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-divider color="stone-light" />
            <v-card-actions class="my-2 d-flex justify-end">
                <v-btn
                  class="font-nav tracking-wide text-caption" rounded="0"
                  variant="text"
                  color="stone"
                  @click="dialog = false"
                >
                  Cancel
                </v-btn>

                <v-btn
                  class="font-nav tracking-wide text-caption"
                  rounded="0"
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import elysianClient from '@/api/elysianClient'
import AdminPageHeader from '@/components/Admin/AdminPageHeader.vue'

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
    roles?: string[]
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
const resources = ['photo', 'product', 'user', 'budget', 'code', 'income'];
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

/** "photo.read", "photo.write" -> [{ resource: 'photo', actions: ['read', 'write'] }], in actions order */
function groupPolicies(policies: string[]) {
    const groups = new Map<string, string[]>()
    for (const policy of policies ?? []) {
        const [resource, action] = policy.split('.')
        if (!resource || !action) continue
        groups.set(resource, [...(groups.get(resource) ?? []), action])
    }
    return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([resource, list]) => ({
            resource,
            actions: [...list].sort((a, b) => actions.indexOf(a) - actions.indexOf(b)),
        }))
}

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
.policy-line {
    line-height: 1.7;
    white-space: nowrap;
}

.policy-resource {
    display: inline-block;
    min-width: 72px;
}

.bordered-card {
    border: 1px solid rgba(var(--v-theme-charcoal), 0.1);
}
</style>
