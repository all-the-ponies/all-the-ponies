<script lang="ts" setup>
import { LOCALES, loadLocaleMessages} from '@/i18n'
import { setLanguage } from '@/main'
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
