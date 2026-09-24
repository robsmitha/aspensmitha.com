<template>
    <v-footer color="background" class="footer-border">
        <v-container>
            <v-row>
                <v-col md="3" cols="12" class="d-flex flex-column justify-end">
                    <span class="font-mono text-subtitle-2 mb-2">
                        <span class="text-primary">rob</span><span class="text-lightest-slate">smitha.com</span>
                    </span>
                    <p class="text-slate text-body-2">Building things on the web since 2016.</p>
                    <div v-if="!$vuetify.display.mobile" class="d-flex align-center mt-auto text-slate font-mono text-caption">
                        <v-icon size="small" class="mr-1">mdi-copyright</v-icon>
                        {{ new Date().getFullYear() }} Rob Smitha
                    </div>
                </v-col>
                <v-col md="3" cols="12">
                    <v-list bg-color="transparent" density="compact">
                        <v-list-subheader class="text-slate font-mono">Pages</v-list-subheader>
                        <v-list-item :active="false" title="Home" value="home" to="/" class="text-light-slate"></v-list-item>
                        <v-list-item :active="false" title="Search Code" value="code" to="/code" class="text-light-slate"></v-list-item>
                        <v-list-item :active="false" title="Generate Code" value="generate-code" to="/generate-code" class="text-light-slate"></v-list-item>
                        <v-list-item :active="false" title="Congress Feed" value="congress" to="/congress" class="text-light-slate"></v-list-item>
                    </v-list>
                </v-col>
                <v-col md="3" cols="12">
                    <v-list bg-color="transparent" density="compact">
                        <v-list-subheader class="text-slate font-mono">External Links</v-list-subheader>
                        <v-list-item title="GitHub" href="https://github.com/robsmitha" target="_blank" class="text-light-slate"></v-list-item>
                        <v-list-item title="LinkedIn" href="https://www.linkedin.com/in/robsmitha/" target="_blank" class="text-light-slate"></v-list-item>
                        <v-list-item title="Resume" href="https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/files/Rob+Smitha+Resume.pdf" target="_blank" class="text-light-slate"></v-list-item>
                    </v-list>
                </v-col>
                <v-col md="3" cols="12">
                    <v-list bg-color="transparent" density="compact">
                        <template v-if="!auth.signedIn">
                            <v-list-item subtitle="Sign in" class="text-light-slate"></v-list-item>
                            <v-list-item v-if="!auth.signedIn" prepend-icon="mdi-microsoft" title="Microsoft" href="/.auth/login/aad" class="text-light-slate"></v-list-item>
                        </template>
                        <template v-else>
                            <v-list-item :subtitle="auth.userDetails" class="text-light-slate"></v-list-item>
                            <v-list-item title="Users" to="/users" class="text-light-slate"></v-list-item>
                            <v-list-item title="Products" to="/products" class="text-light-slate"></v-list-item>
                            <v-list-item title="Spending" to="/spending" class="text-light-slate"></v-list-item>
                            <v-list-item title="Accounts" to="/accounts" class="text-light-slate"></v-list-item>
                        </template>
                    </v-list>
                </v-col>
            </v-row>
        </v-container>
    </v-footer>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/store/auth"
const auth = useAuthStore()
</script>

<style scoped>
.footer-border {
  border-top: 1px solid rgb(var(--v-theme-lightest-navy));
}
</style>