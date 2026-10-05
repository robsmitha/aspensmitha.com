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
                            <v-menu location="bottom end">
                                <template v-slot:activator="{ props: menuProps }">
                                    <v-btn
                                        v-bind="menuProps"
                                        icon="mdi-dots-horizontal"
                                        variant="text"
                                        size="small"
                                        color="stone"
                                        :aria-label="`Actions for ${item.userName}`"
                                    ></v-btn>
                                </template>
                                <v-list density="compact" rounded="0" min-width="200" class="py-1">
                                    <v-list-item prepend-icon="mdi-key-variant" @click="editUser(item)">
                                        <v-list-item-title class="font-nav text-body-2">Edit Permissions</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
    <v-dialog v-model="dialog" persistent max-width="640" scrollable>
        <v-card color="surface" rounded="0">
            <v-toolbar color="ivory-deep" density="comfortable">
                <template v-slot:prepend>
                    <v-avatar color="blush" variant="tonal" size="40" class="me-3">
                        <v-icon color="blush-dark">mdi-account-key-outline</v-icon>
                    </v-avatar>
                </template>
                <v-toolbar-title>
                    <div class="font-display text-h6 text-charcoal">{{ selectedUser?.userName }}</div>
                    <div class="font-nav text-caption text-stone">{{ selectedUser?.identityProvider }}</div>
                </v-toolbar-title>
                <v-btn
                    icon="mdi-close"
                    variant="text"
                    color="stone"
                    @click="dialog = false"
                ></v-btn>
            </v-toolbar>
            <v-divider color="stone-light" />
            <v-card-text class="pa-0">
                <div v-if="selectedUser?.accessControl.roles?.length" class="px-6 pt-5 pb-1">
                    <span class="font-nav tracking-widest text-blush text-caption text-uppercase d-block mb-2">Roles</span>
                    <v-chip
                        v-for="role in selectedUser.accessControl.roles"
                        :key="role"
                        size="small"
                        variant="tonal"
                        color="blush"
                        class="font-nav me-1 mb-1"
                    >{{ role }}</v-chip>
                </div>

                <div class="px-6 pt-4 pb-2 d-flex align-center justify-space-between">
                    <span class="font-nav tracking-widest text-blush text-caption text-uppercase">Permissions</span>
                    <span class="font-nav text-caption text-stone">{{ grantedCount }} of {{ totalCount }} granted</span>
                </div>

                <v-table density="comfortable" class="permission-matrix">
                    <thead>
                        <tr>
                            <th class="font-nav text-caption text-uppercase text-stone text-left">Resource</th>
                            <th
                                v-for="action in actions"
                                :key="action"
                                class="font-nav text-caption text-uppercase text-stone"
                            >
                                <div class="d-flex flex-column justify-center">
                                    <span>{{ capitalize(action) }}</span>
                                    <v-checkbox-btn
                                        :model-value="isColumnGranted(action)"
                                        :indeterminate="isColumnPartial(action)"
                                        color="blush"
                                        density="compact"
                                        @update:model-value="val => setColumn(action, !!val)"
                                    />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="resource in resources" :key="resource">
                            <td>
                                <div class="d-flex align-center ga-2">
                                    <v-icon size="18" color="stone">{{ resourceIcon(resource) }}</v-icon>
                                    <span class="font-nav text-body-2 text-charcoal">{{ capitalize(resource) }}</span>
                                </div>
                            </td>
                            <td v-for="action in actions" :key="action">
                                <div class="d-flex justify-center">
                                    <v-checkbox-btn
                                        :model-value="getPolicy(resource, action)"
                                        color="blush"
                                        density="compact"
                                        @update:model-value="val => setPolicy(resource, action, !!val)"
                                    />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
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
const resources = ['photo', 'product', 'user'];
const actions = ['read', 'write', 'delete'];
const resourceIcons: Record<string, string> = {
    photo: 'mdi-image-outline',
    product: 'mdi-package-variant-closed',
    user: 'mdi-account-outline',
}
const resourceIcon = (resource: string) => resourceIcons[resource] ?? 'mdi-shape-outline'

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

const totalCount = computed(() => resources.length * actions.length)

const grantedCount = computed(() =>
  selectedUser.value?.accessControl.policies.filter(p => {
    const [resource, action] = p.split('.')
    return resources.includes(resource) && actions.includes(action)
  }).length ?? 0
)

const isColumnGranted = (action: string) => resources.every(resource => getPolicy(resource, action));

const isColumnPartial = (action: string) => {
  const granted = resources.filter(resource => getPolicy(resource, action)).length
  return granted > 0 && granted < resources.length
}

const setColumn = (action: string, value: boolean) => {
  resources.forEach(resource => setPolicy(resource, action, value))
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/** "photo.read", "photo.write" -> [{ resource: 'photo', actions: ['read', 'write'] }], in actions order */
function groupPolicies(policies: string[]) {
    const groups = new Map<string, string[]>()
    for (const policy of policies ?? []) {
        const [resource, action] = policy.split('.')
        if (!resource || !action || !resources.includes(resource)) continue
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

.permission-matrix :deep(th),
.permission-matrix :deep(td) {
    border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.08) !important;
}

.permission-matrix :deep(tbody tr:hover) {
    background: rgba(var(--v-theme-blush), 0.06);
}

.permission-matrix :deep(td:first-child),
.permission-matrix :deep(th:first-child) {
    padding-inline-start: 24px;
}
</style>
