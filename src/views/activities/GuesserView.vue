<script setup lang="ts">
import type { GameObject } from '@/types/gameDataTypes'

import DialogComponent from '@/components/DialogComponent.vue'
import { language } from '@/main'
import { formatNumber, formatTime, formatTimestamp, pickRandom, scrollIntoViewWithOffset, staticImage, transformName } from '@/scripts/common'
import gameData from '@/scripts/gameData'
import type { PonyType } from '@/types/gameDataTypes'
import { computed, guardReactiveProps, nextTick, ref, useTemplateRef, watch, watchEffect, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'

const { t } = useI18n()

useHead({
    title: t('guesser.title')
})

const options = ref({
    ignoreSpaces: true,
    caseSensitive: false,
    ignoreAccents: true,
    ignorePunctuation: true,
    includeUnused: false,
})

const optionNames = {
    ignoreSpaces: 'pony_quiz.options.ignore_spaces',
    caseSensitive: 'pony_quiz.options.case_sensitive',
    ignoreAccents: 'pony_quiz.options.ignore_accents',
    ignorePunctuation: 'pony_quiz.options.ignore_punctuation',
    includeUnused: 'pony_quiz.options.include_unused',
}

const guessedPonies = ref<PonyType[]>([])
const loadFailedPonies = ref<PonyType[]>([])
const ponies = computed(() => {
    const ponies: PonyType[] = []

    for (let pony of Object.values(gameData.data.categories.pony.objects)) {
        if (loadFailedPonies.value.includes(pony)) {
            continue
        } else if (!options.value.includeUnused && (pony.tags.includes('unused') || pony.tags.includes('npc'))) {
          continue
        } else if (pony.tags.includes('quest') || (pony.group.length > 0 && !pony.group_master)) {
          continue
        }
        ponies.push(pony)
    }

    return ponies
})
const availablePonies = computed(() => ponies.value.filter((pony) => !guessedPonies.value.includes(pony)))

const timeElapsed = ref<number>(0)
let timerInterval = null
let transitionTimeout = null
const playing = ref<boolean>(false)
const currentPony = ref<PonyType | null>(null)
const displayName = ref<string>('')
const imageUrl = computed(() => {
    console.log('imageUrl', currentPony.value)
    if (currentPony.value !== null) {
        return staticImage(currentPony.value.image.main)
    }
    return ''
})
const ponyImage = useTemplateRef('pony-image')
const imageLoaded = ref<boolean>(false)
const canGuess = ref<boolean>(false)
const description = ref<string>('')
const silhouette = ref<boolean>(true)

const query = ref<string>('')
const nameInput = useTemplateRef('name-input')
const winDialog = useTemplateRef('win-dialog')
const gameContainer = useTemplateRef('game-container')
const optionsDialog = useTemplateRef('options-dialog')


function togglePlaying() {
    playing.value = !playing.value

    if (playing.value) {
        start()
    } else {
        // gameContainer.value.scrollIntoView()
        stop()
    }
}

function start() {
    guessedPonies.value = []
    resetTimer()
    startTimer()
    pickPony()
    nextTick(() => {
        gameContainer.value.scrollIntoView()
        nameInput.value.focus()
    })
}

function stop() {
    pauseTimer()
    if (transitionTimeout !== null) {
        clearTimeout(transitionTimeout)
        transitionTimeout = null
    }
}

function resetUi() {
    displayName.value = '???'
    description.value = ''
    query.value = ''
    canGuess.value = true
    transitionTimeout = null
}

function resetTimer() {
    pauseTimer()
    timeElapsed.value = 0
}

function startTimer() {
    timerInterval = setInterval(() => timeElapsed.value++, 1000)
}

function pauseTimer() {
    if (timerInterval != null) {
        clearInterval(timerInterval)
        timerInterval = null
    }
}

onBeforeRouteLeave(() => {
  // make sure the interval is cleared before leaving
  stop()
})

function checkName(event: Event) {
    if (!canGuess.value) {
        return
    }
    
    const transformOptions = {
      ignoreSpaces: options.value.ignoreSpaces,
      caseSensitive: options.value.caseSensitive,
      ignoreAccents: options.value.ignoreAccents,
      ignorePunctuation: options.value.ignorePunctuation,
      includeUnused: options.value.includeUnused,
    }

    const transformedName = transformName(query.value, transformOptions)

    if (
        currentPony.value.preferred_name &&
        currentPony.value.preferred_name[language.value.key] &&
        transformName(currentPony.value.preferred_name[language.value.key], transformOptions) == transformedName
    ) {
        guessedCorrectly()
    } else if (
        transformName(currentPony.value.name[language.value.key], transformOptions) === transformedName
    ) {
        guessedCorrectly()
    } else if (currentPony.value.alt_name && currentPony.value.alt_name[language.value.key]) {
        if (
            currentPony.value.alt_name[language.value.key]
            .some((name) => transformName(name, transformOptions) === transformedName)
        ) {
            guessedCorrectly()
        }
    }

    if (guessedPonies.value.length === ponies.value.length) {
        win()
    }
}

function guessedCorrectly() {
    guessedPonies.value.push(currentPony.value)
    nextPony()
}

function nextPony() {
    nameInput.value.focus()
    silhouette.value = false
    displayName.value = gameData.translateName(currentPony.value).value
    description.value = currentPony.value.description[language.value.key]
    canGuess.value = false
    transitionTimeout = setTimeout(() => {
        pickPony()
        transitionTimeout = null
    }, 2000)
}

function pickPony() {
    let tempPony = pickRandom(availablePonies.value)

    currentPony.value = tempPony
}

function showHint() {
    let tempDescription: string = currentPony.value.description[language.value.key]
    const names: string[] = [
        currentPony.value.name[language.value.key]
    ]

    if (currentPony.value.preferred_name && currentPony.value.preferred_name[language.value.key]) {
        names.push(currentPony.value.preferred_name[language.value.key])
    }
    if (currentPony.value.alt_name && currentPony.value.alt_name[language.value.key]) {
        names.push(...currentPony.value.alt_name[language.value.key])
    }

    for (let name of names) {
        tempDescription = tempDescription.replaceAll(name, name.replaceAll(/./g, '_'))
    }
    
    description.value = tempDescription

    nameInput.value.focus()
}

function win() {
    togglePlaying()
    winDialog.value.open()
}

function imageLoadedCallback() {
    imageLoaded.value = true
    silhouette.value = true
    resetUi()
}

function imageLoadFailed() {
    imageLoaded.value = false
    if (playing.value) {
        loadFailedPonies.value.push(currentPony.value)
        pickPony()
    }
}
</script>

<template>
    <div>
        <div>
            <h1>{{ $t('guesser.title') }}</h1>
            <p>{{ $t('guesser.description') }}</p>
            <button @click="togglePlaying" class="button button-green">{{ $t(playing ? 'button.stop' : 'button.start') }}</button>
        </div>
        <div class="game-container" ref="game-container">
            <div class="game-section">
                <div class="game-bar" ref="game-bar">
                    <div>
                        {{ $t('guesser.message.guessed_correctly', {
                            ponies: $n(guessedPonies.length),
                            total: $n(ponies.length),
                        }) }} {{ $t('guesser.message.time', {
                            time: formatTimestamp(timeElapsed)
                        }) }}
                    </div>
                    <div class="game-controls">
                        <input
                            v-model="query"
                            @input="checkName"
                            ref="name-input"
                            type="text"
                            :placeholder="$t('common.name')"
                            class="name-input text-box"
                            :disabled="!playing"
                        >
                        <button
                            @click="nextPony()"
                            :disabled="!playing || !canGuess"
                            class="button button-green"
                        >{{ $t('button.skip') }}</button>
                        <button
                            @click="showHint()"
                            :disabled="!playing || !canGuess"
                            class="button button-green"
                        >{{ $t('button.hint') }}</button>
                    </div>
                </div>
                <div class="pony-info">
                    <h2>{{ displayName }}</h2>
                    <img
                        ref="pony-image"
                        class="pony-image"
                        :class="{
                            'not-loaded': !imageLoaded,
                            silhouette: silhouette,
                        }"
                        :src="imageUrl"
                        :alt="displayName"
                        draggable="false"

                        @load="imageLoadedCallback"
                        @error="imageLoadFailed"
                    >
                    <p class="description">{{ description }}</p>
                </div>
            </div>
            <div class="guessed-ponies-container">
                {{ $t('guesser.message.correct_guesses') }}
                <div class="guessed-ponies-wrapper">
                    <div class="guessed-ponies-list">
                        <router-link
                            v-for="pony in guessedPonies"
                            :to="{
                                name: 'pony',
                                params: {
                                    id: pony.id
                                }
                            }"
                            class="guessed-pony link"
                            target="_blank"
                            :key="pony.id"
                        >
                            <img class="pony-portrait" :src="staticImage(pony.image.portrait)" :alt="gameData.translateName(pony).value">
                            <span>{{ gameData.translateName(pony).value }}</span>
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
        
        <DialogComponent
            ref="win-dialog"
            :title="$t('game.message.you_won')"
        >
            <div class="win-body">
                {{ $t('pony_quiz.message.win_message', {
                    time: formatTime(timeElapsed),
                    num_ponies: $n(guessedPonies.length),
                }) }}
            </div>

            <template #menu>
                <button @click="winDialog.close()" class="button button-blue">{{ $t('button.ok') }}</button>
            </template>

        </DialogComponent>
        
        <DialogComponent
            ref="options-dialog"
            :title="'Options'"
        >
            
            <div class="dialog-options">
                <label v-for="key in Object.keys(options)">
                    <input v-model="options[key]" type="checkbox" :name="key">
                    {{ $t(optionNames[key]) }}
                </label>
            </div>
            
            <template #menu>
                <button @click="optionsDialog.close()" class="button button-green">{{ $t('button.ok') }}</button>
            </template>
        </DialogComponent>
    </div>
</template>

<style lang="css" scoped>
.game-bar {
    padding-block: 0.2rem;
    background: var(--page-background-color);
    width: 100%;
}

.game-controls {
    display: flex;
}

.name-input {
    flex-grow: 1;
}

.pony-image {
    max-width: 100%;
    min-width: 5rem;
}
    
.pony-image.not-loaded {
    display: none;
}

.pony-image.silhouette {
    filter: brightness(0);
}

.guessed-ponies-list {
    display: grid;
    grid-template-columns: subgrid;
}

.guessed-pony {
    display: grid;
    align-items: center;
    grid-template-columns: 3rem auto;
    gap: 0.5rem;
}

.pony-portrait {
    width: 100%;
    object-fit: contain;
    object-position: center;
}

@media screen and (min-width: 700px) {
    .game-container {
        height: 100dvh;
        display: grid;
        grid-template-columns: 50% 50%;
        /* overflow-y: hidden; */
    }

    .game-section {
        overflow-y: auto;
        /* height: 100%; */
        display: grid;
        align-content: start;
    }

    .pony-info {
        overflow-y: auto;
    }

    .guessed-ponies-container {
        display: grid;
        align-content: start;
        height: 100%;
        overflow-y: hidden;
    }

    .guessed-ponies-wrapper {
        overflow-y: auto;
    }
}

@media screen and (max-width: 700px) {
    .game-container {
        /* min-height: 100dvh;
        display: grid;
        grid-template-columns: 1fr; */
        /* overflow-y: hidden; */
    }

    .game-section {
        min-height: 100dvh;
        /* overflow-y: auto; */
        /* height: 100%; */
        /* display: grid;
        align-content: start; */
    }

    .game-bar {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    .guessed-ponies-container {
        min-height: 100dvh;
    }

    .pony-info {
        /* overflow-y: auto; */
    }

    .guessed-ponies-container {
        /* display: grid;
        align-content: start;
        height: 100%;
        overflow-y: hidden; */
    }

    .guessed-ponies-wrapper {
        /* overflow-y: auto; */
    }
}

.win-body {
    text-align: center;
}
</style>
