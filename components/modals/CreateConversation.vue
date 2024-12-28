<template>
    <div class="flex items-center justify-center h-screen px-4 sm:px-10">
        <div class="w-full lg:w-1/2 bg-neutral-900 rounded-xl mx-auto px-4 sm:px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-lg sm:text-xl font-bold">Créer une conversation</h1>
                    <p class="text-neutral-400">Entrez les noms des personnes avec lesquelles vous souhaitez discuter</p>
                </div>
                <div @click="close">
                    <Icon name="solar:close-circle-outline" class="text-2xl cursor-pointer hover:text-red-500" />
                </div>
            </div>
            <div class="flex bg-amber-500/20 rounded overflow-hidden space-x-4 my-4">
                <div class="w-1 bg-amber-500"></div>
                <div class="flex-1 text-amber-500 py-2">
                    <p>Les personnes avec lesquelles vous souhaitez discuter doivent être inscrites sur la plateforme.</p>
                </div>
            </div>
            <div>
                <div v-if="step == 1" class="space-y-4">
                    <Input @update:input="search = $event" :input="search" placeholder="Rechercher une conversation" name="search" id="search" icon="tabler:search" />
                    <div class="space-y-2">
                        <div v-if="selected.length" class="flex overflow-x-scroll space-x-2 custom-scrollbar">
                            <template v-for="(contact) in selected" :key="contact.id">
                                <Contact :user="contact" @select="selected.splice(selected.indexOf(contact), 1)" :minimized="true"/>
                            </template>
                        </div>
                        <div v-if="selected.length && available.length" class="border-b border-neutral-800"></div>
                        <div v-if="available" class="space-y-2">
                            <template v-for="(contact) in available" :key="contact.id">
                                <Contact :user="contact" @select="selected.push($event)" :minimized="false"/>
                            </template>
                        </div>
                    </div>
                    <div v-if="selected.length > 1" @click="step++" class="flex items-center justify-end cursor-pointer hover:text-violet-600">
                        <p>Prochain étape</p>
                        <Icon name="ic:round-navigate-next" class="text-2xl" />
                    </div>
                </div>
                <div v-else-if="step == 2" class="space-y-4">
                    <Input @update:input="group = $event" :input="group" label="Nom du groupe" placeholder="Nom du groupe" name="group" id="group" />
                    <div @click="step--" class="flex items-center cursor-pointer hover:text-violet-600 space-x-2">
                        <Icon name="ic:round-navigate-before" class="text-2xl" />
                        <p>Retour</p>
                    </div>
                </div>
            </div>
            <div v-if="selected.length == 1 || selected.length > 1 && step == 2" class="mt-6">
                <Button @click="create" class="w-full">Créer</Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { User } from '~/types/user';

const store = useConversationStore();
const step = ref(1);
const search = ref('');
const contacts = ref<User[]>([]);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);

const selected = ref<User[]>([]);
const group = ref('');

const emit = defineEmits(['close']);

watch(() => search.value, (value) => {
    if (timer.value) clearTimeout(timer.value);
    timer.value = setTimeout(async () => {
        contacts.value = await store.search(value);
    }, 500);
});

const available = computed<User[]>(() => {
    const ids = selected.value.map((contact) => contact.id);
    return contacts.value.filter((contact) => !ids.includes(contact.id));
});

const create = () => {
    const data = {
        name: group.value,
        users: selected.value
    };
    store.create(data);
}

const close = () => {
    emit('close');
}
</script>