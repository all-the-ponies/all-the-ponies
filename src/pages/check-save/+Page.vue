<script setup lang="ts">
import Link from '@/components/Link.vue';
import { useSaveStore } from '@/stores/saveManager';
import { Config } from 'vike-vue/Config';
import { nextTick, onMounted, ref, useTemplateRef } from 'vue';

const SUPPORT_URL = "https://support.gameloft.com/contactus?igagame=POWN&verify=yes"

const saveStore = useSaveStore()

enum Status {
    NONE,
    AFFECTED,
    SAFE,
}

const status = ref<Status>(Status.NONE)
const friendCodeInput = useTemplateRef('friend-code')
const friendCode = ref<string>("")
const importDisabled = ref<boolean>(false)
const errorMessage = ref<string>("")

onMounted(() => {
    friendCode.value = saveStore.playerInfo.friendCode
})

async function checkFriendCode() {
    errorMessage.value = ''
    if (!friendCode.value) {
        return
    }
    importDisabled.value = true

    try {
        await saveStore.loadFromCloud(friendCode.value)
        status.value = Status.SAFE
    } catch (error) {
        console.error(error)
        if (String(error).includes('Save file for')) {
            status.value = Status.AFFECTED
        } else {
            errorMessage.value = error
            nextTick(() => {
                friendCodeInput.value.focus()
            })
        }
    }

    importDisabled.value = false
}

</script>

<template>
    <Config :title="$t('save_check.title')" :description="$t('save_check.description')"></Config>

    <div>
        <section class="section">
            <h1>{{ $t('save_check.title') }}</h1>
            <div class="main-body">
                <p>{{ $t('save_check.messages.explanation.first') }}</p>
                <p>{{ $t('save_check.messages.explanation.second') }}</p>
                <p>{{ $t('save_check.messages.explanation.third') }}</p>
                <p>{{ $t('save_check.messages.explanation.fourth') }}</p>
            </div>
        </section>
        <section class="section">
            <label>
                {{ $t('player_info.friend_code') }}
                <input
                    v-model="friendCode"
                    ref="friend-code"
                    type="text"
                    name="friend-code"
                    class="text-box"
                    :placeholder="$t('player_info.friend_code')"
                    spellcheck="false"
                    :disabled="importDisabled"
                    @keydown="(e) => {if (e.key === 'Enter') checkFriendCode()}"
                    @input="errorMessage = ''"
                >
                <button
                    class="button button-blue"
                    :disabled="importDisabled"
                    @click="checkFriendCode()"
                >{{ $t('check_save.messages.check') }}</button>
            </label>
            <div class="error">{{ errorMessage }}</div>
            <div v-if="status === Status.SAFE" class="status safe">{{ $t('save_check.messages.status.safe') }}</div>
            <div v-if="status === Status.AFFECTED" class="status affected">{{ $t('save_check.messages.status.affected') }}</div>
        </section>
        <template v-if="status != Status.NONE">
            <section class="section">
                <h2>{{ $t('save_check.messages.what_this_means.title') }}</h2>
                <p v-if="status == Status.SAFE">{{ $t('save_check.messages.what_this_means.body.safe') }}</p>
                <p v-if="status == Status.AFFECTED">{{ $t('save_check.messages.what_this_means.body.affected') }}</p>
            </section>
            <section class="section">
                <h2>{{ $t('save_check.messages.what_can_you_do.title') }}</h2>
                <i18n-t keypath="save_check.messages.what_can_you_do.body">
                    <template #support>
                        <Link :href="SUPPORT_URL" class="link" target="_blank">
                            {{ $t('save_check.messages.what_can_you_do.customer_support') }}
                        </Link>
                    </template>
                </i18n-t>
            </section>
            <section class="section">
                <h2>{{ $t('save_check.messages.what_to_say.title') }}</h2>
                <ol v-if="status == Status.AFFECTED">
                    <li>{{ $t('save_check.messages.what_to_say.body.affected.1') }}</li>
                    <li>{{ $t('save_check.messages.what_to_say.body.affected.2') }}</li>
                    <li>{{ $t('save_check.messages.what_to_say.body.affected.3') }}</li>
                    <li>{{ $t('save_check.messages.what_to_say.body.affected.4') }}</li>
                </ol>
                <ol v-if="status == Status.SAFE">
                    <li>{{ $t('save_check.messages.what_to_say.body.safe.1') }}</li>
                    <li>{{ $t('save_check.messages.what_to_say.body.safe.2') }}</li>
                </ol>
            </section>
            <section class="section">
                <Link :href="SUPPORT_URL" class="button button-green" target="_blank">
                    {{ $t('save_check.messages.what_can_you_do.customer_support') }}
                </Link>
            </section>
        </template>
    </div>
</template>

<style lang="css" scoped>

.error {
    color: var(--red);
}

.status.safe {
    color: var(--green);
}

.status.affected {
    color: var(--red);
}

</style>
