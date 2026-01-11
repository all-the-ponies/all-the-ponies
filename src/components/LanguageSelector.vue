<script lang="ts" setup>
import { setLanguage } from '@/globals';
import { LOCALES } from '@/i18n'
</script>

<template>
    <select
     name="language"
     id="language"

     @change="(event) => {setLanguage((event.target as HTMLSelectElement).value)}"
    >
        <option
            v-for=" [ code, lang ]  in Object.entries(LOCALES)"
            :value="code"
        >
            {{ new Intl.DisplayNames([code], { type: "language" }).of(code) }}
        </option>
    </select>
</template>
