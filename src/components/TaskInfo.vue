<script setup lang="ts">
import { language } from '@/globals';
import { createAssetUrl } from '@/scripts/assets';
import { getObject, getTaskInfo, translateName } from '@/scripts/gameData';
import type { TaskEntry } from '@/types/gameDataTypes';
import { computed } from 'vue';
import ObjectImage from './ObjectImage.vue';
import Link from './Link.vue';
import { formatTime } from '@/scripts/timeFunctions.ts';
import CurrencyImage from './CurrencyImage.vue';
import LazyImage from './LazyImage.vue';
import ChanceBar from './ChanceBar.vue';

const props = defineProps<{
    taskId: string | TaskEntry,
    href?: string,
}>()

const taskInfo = computed(() => getTaskInfo(props.taskId))
const href = computed(() => props.href)

const pony = computed(() => getObject(taskInfo.value.pony, 'pony'))

const requiredPony = computed(() => getObject(taskInfo.value.requirement.pony))
const requiredHouse = computed(() => {
    if (taskInfo.value.requirement.house == '<Home>') {
        return null
    }
    return getObject(taskInfo.value.requirement.house)
})
4
const token = computed(() => getObject(taskInfo.value.reward.token, 'token'))

</script>

<template>
    <div class="task" :class="{hidden: taskInfo.hidden}">
        <div class="header">
            <div class="task-image-container">
                <img :src="createAssetUrl(taskInfo.image.path)" :alt="$t('tasks.message.task_icon')">
            </div>
            <Link v-if="href" class="title" :href="href">
                {{ taskInfo.name[language.key] }}
            </Link>
            <span v-else class="title">
                {{ taskInfo.name[language.key] }}
            </span>
        </div>
        <div class="body">
            <div class="portrait-section">
                <div class="portrait-container">
                    <ObjectImage class="main-portrait" :object="taskInfo.pony" type="portrait"></ObjectImage>
                    <ObjectImage v-if="requiredPony || requiredHouse" class="additional-portrait" :object="requiredPony || requiredHouse" type="portrait"></ObjectImage>
                </div>
            </div>
            <div class="pony-names">
                <Link class="link" :href="`/${pony.category}/${pony.id}`">{{ translateName(pony) }}</Link>
                <template v-if="requiredPony || requiredHouse">
                    +
                    <Link v-if="requiredPony" class="link" :href="`/${requiredPony.category}/${requiredPony.id}`">{{ translateName(requiredPony) }}</Link>
                    <Link v-else-if="requiredHouse" class="link" :href="`/${requiredHouse.category}/${requiredHouse.id}`">{{ translateName(requiredHouse) }}</Link>
                </template>
            </div>
            <div class="extra-info">
                <div class="duration">
                    <img src="@/assets/images/ui/timer.png" loading="lazy" :alt="$t('tasks.message.duration')" :title="$t('tasks.message.duration')">
                    {{ formatTime(taskInfo.duration) }}
                </div>
                <div class="skip-cost">
                    <i18n-t keypath="tasks.message.skip_price">
                        <template #price>
                            <CurrencyImage object="Gems">
                                {{ taskInfo.skip_cost }}
                            </CurrencyImage>
                        </template>
                    </i18n-t>
                </div>
            </div>
        </div>
        <div class="footer">
            <div>
                <CurrencyImage v-if="taskInfo.reward.gems" object="Gems">
                    +{{ taskInfo.reward.gems }}
                </CurrencyImage>
                <CurrencyImage v-else-if="taskInfo.reward.bits" object="Bits">
                    +{{ taskInfo.reward.bits }}
                </CurrencyImage>
            </div>
            <div>
                <CurrencyImage v-if="taskInfo.reward.xp" object="XP">
                    +{{ taskInfo.reward.xp }}
                </CurrencyImage>
            </div>
            <div class="token">
                <template v-if="token">
                    <span class="token-image">
                        <CurrencyImage :object="token">
                            {{ taskInfo.reward.token_amount > 1 ? `+${taskInfo.reward.token_amount}` : '' }}
                            <!-- + {{ taskInfo.reward.token_amount }} -->
                        </CurrencyImage>
                    </span>
                    <span class="token-rate">
                        <p>{{ $n(taskInfo.chance / 100, {style: 'percent'}) }}</p>
                        <ChanceBar :rate="taskInfo.chance"></ChanceBar>
                    </span>
                </template>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.task {
    background-color: white;
    border-radius: 1rem;
    max-width: 30rem;

    margin: 0.5rem;
}

.task.hidden {
    background-color: hsl(0, 0%, 78%);
}

.header {
    display: grid;
    grid-template-columns: auto 1fr;
    
    background-color: var(--pink);
    color: white;
    
    border-radius: inherit;
}

.task-image-container {
    background-color: var(--pink);
    border: 0.2rem solid white;
    border-radius: 50%;

    padding: 0.5rem;
    margin: -0.4rem;
    margin-right: 0;

    width: 3rem;
    height: 3rem;

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
    }
}

.title {
    align-self: center;
    justify-self: center;
    text-align: center;
    font-size: 1.6rem;
    padding: 0.3rem;

    color: white;
    text-decoration: none;
}

a.title:hover {
    text-decoration: underline;
}

.body {
    display: grid;
    grid-template-columns: auto 1fr auto;
    justify-content: space-between;
    align-items: center;

    padding: 0.7rem;

    /* text-shadow: 0rem 0.1rem white; */
    -webkit-text-stroke: 0.15rem white;
    paint-order: stroke fill;
}

.portrait-container {
    position: relative;
    width: 4rem;
    height: 4rem;
    padding: 0.5rem;
}

.main-portrait {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
}

.additional-portrait {
    width: 2rem;
    height: 2rem;
    position: absolute;
    bottom: 0;
    left: 0;
}

.pony-names {
    font-size: 1.2rem;
    justify-self: center;
}

.duration img {
    height: 1em;
    object-fit: contain;
    object-position: center;
}

.footer {
    border-radius: inherit;

    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr;
    justify-items: center;
    align-items: center;
    
    background-color: #eea52dff;
    color: white;
    padding: 0.5rem;
}

.token {
    flex: 1;
    display: grid;
    justify-self: right;
    grid-template-columns: 1fr 2.5rem;
    gap: 0.8rem;
}

.token-image {
    text-align: right;
}

.token-rate {
    font-size: 1rem;
    text-align: center;
}

</style>
