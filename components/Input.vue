<template>
    <div class="flex-1 space-y-2">
        <label v-if="label" :for="name">{{ label }} </label>
        <div class="flex items-center w-full bg-neutral-900 ring-1 ring-neutral-800/70 focus:ring-violet-800 outline-none rounded overflow-hidden space-x-2" :class="{'pl-2': icon}">
            <Icon :name="icon" class="text-neutral-500" :class="{'w-5 h-5': icon}" />
            <input @input="$emit('update:input', ($event.target as HTMLInputElement).value)" @keyup="onEnter" :value="input" class="flex-1 bg-neutral-900 outline-none placeholder:text-neutral-600 p-2" :type="type" :placeholder="placeholder" :name="name" :id="id"/>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    label: String,
    type: {
        type: String,
        default: 'text'
    },
    name: String,
    id: String,
    input: String,
    placeholder: String,
    icon: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:input', 'enter']);

const onEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        emit('enter');
    }
}
</script>