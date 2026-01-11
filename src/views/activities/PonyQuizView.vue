<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue'
import { language } from '@/globals'
import { formatTime, formatTimestamp, scrollIntoViewWithOffset, staticImage, transformName } from '@/scripts/common'
import gameData from '@/scripts/gameData'
import type { PonyType } from '@/types/gameDataTypes'
import { useMounted } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

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

const isMounted = useMounted()

const gameBar = useTemplateRef('game-bar')
const gameBarHeight = computed(() => isMounted ? 0 : getComputedStyle(gameBar.value).height)

const guessedPonies = ref<PonyType[]>([])
const ponies = computed(() => {
    const ponies: PonyType[] = []

    for (let pony of Object.values(gameData.data.categories.pony.objects)) {
        if (!options.value.includeUnused && (pony.tags.includes('unused') || pony.tags.includes('npc'))) {
          continue
        }
        if (pony.tags.includes('quest') || (pony.group.length > 0 && !pony.group_master)) {
          continue
        }
        ponies.push(pony)
    }

    return ponies
})

const timeElapsed = ref<number>(0)
const timerInterval = ref(null)
const playing = ref<boolean>(false)

const query = ref<string>('')
const nameInput = useTemplateRef('name-input')
const winDialog = useTemplateRef('win-dialog')
const gameContainer = useTemplateRef('game-container')
const optionsDialog = useTemplateRef('options-dialog')

function togglePlaying() {
    playing.value = !playing.value

    if (playing.value) {
        guessedPonies.value = []
        resetTimer()
        startTimer()
        nextTick(() => {
            gameBar.value.scrollIntoView()
            nameInput.value.focus()
        })
    } else {
        gameContainer.value.scrollIntoView()
        pauseTimer()
    }
}

function resetTimer() {
    pauseTimer()
    timeElapsed.value = 0
}

function startTimer() {
    timerInterval.value = setInterval(() => timeElapsed.value++, 1000)
}

function pauseTimer() {
    if (timerInterval.value != null) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
    }
}

onBeforeRouteLeave(() => {
  // make sure the interval is cleared before leaving
  pauseTimer()
})

function checkName(event: Event) {
    query.value = query.value.replace('\n', '')
    let found: PonyType[] = []
    
    const transformOptions = {
      ignoreSpaces: options.value.ignoreSpaces,
      caseSensitive: options.value.caseSensitive,
      ignoreAccents: options.value.ignoreAccents,
      ignorePunctuation: options.value.ignorePunctuation,
      includeUnused: options.value.includeUnused,
    }

    let transformedName = transformName(query.value, transformOptions)

    for (let pony of ponies.value) {
        if (guessedPonies.value.includes(pony)) {
            continue
        }

        if (transformName(pony.name[language.value.key], transformOptions) == transformedName) {
            found.push(pony)
            continue
        } else if (
          pony.preferred_name && pony.preferred_name[language.value.key] &&
          transformName(pony.preferred_name[language.value.key], transformOptions) == transformedName
        ) {
          found.push(pony)
          continue
        } else if (pony.alt_name && pony.alt_name[language.value.key]?.length > 0) {
            for (let alt_name of pony.alt_name[language.value.key]) {
                if (transformName(alt_name, transformOptions) == transformedName) {
                  found.push(pony)
                  break
                }
            }
        }
    }

    if (found.length > 0) {
        guessedPonies.value.push(...found)
        query.value = ''
    }

    if (guessedPonies.value.length === ponies.value.length) {
        win()
    }
}

function win() {
    togglePlaying()
    winDialog.value.open()
}

</script>

<template>
<div>
    
    <section>
        <h1>{{ $t('pony_quiz.title') }}</h1>
        <p>
            {{ $t('pony_quiz.description') }}
        </p>
    </section>
    <button @click="optionsDialog.open()" class="button button-blue">Options</button>
    <div class="game" :class="{playing}" ref="game-container">
        <div class="game-bar" ref="game-bar">
            <div class="game-info">
                {{ $t('pony_quiz.time') }}: {{ formatTimestamp(timeElapsed) }} {{ $t('game_object.pony.pony', 2) }}: {{ $n(Object.keys(guessedPonies).length) }}/{{ $n(ponies.length) }}
                <button @click="togglePlaying" class="button button-green">{{ $t(playing ? 'button.stop' : 'button.start') }}</button>
            </div>
            <textarea @input="checkName" ref="name-input" v-model="query" :disabled="!playing" class="text-box name-input" :placeholder="$t('game_object.pony.pony', 1)" rows="1"></textarea>
        </div>

        <div class="ponies-list-container">
            <div class="ponies-list">
                <div v-for="(pony, index) in guessedPonies" :key="pony.id">
                    <router-link :to="{
                          name: 'pony',
                          params: {
                              id: pony.id
                          }
                      }"
                      class="link pony-name"
                      target="_blank"
                      @vue:mounted="({ el }) => {
                        if (playing && index === guessedPonies.length - 1) {
                          scrollIntoViewWithOffset((el as HTMLElement), gameBar.offsetHeight)
                        }
                      }"
                    >
                        <img class="pony-portrait" :src="staticImage(pony.image.portrait)" :alt="pony.name[language.key]">
                        {{ gameData.translateName(pony) }}
                    </router-link>
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
</div>
</template>

<style lang="css" scoped>
.game {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
}

.pony-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pony-portrait {
    height: 3rem;
}

.game-bar {
    position: sticky;
    top: 0;
    background-color: var(--page-background-color);
}

.game-info,
.name-input{
    margin-block: 0.2rem;
}

.name-input {
    width: 100%;
}

.ponies-list {
    display: flex;
    flex-direction: column;
    padding-block: 0.5rem;
}

.playing .ponies-list {
    flex-direction: column-reverse;
}

@media screen and (max-width: 50rem) {
    .game.playing {
        flex-direction: column-reverse;
    }
    
    .playing .ponies-list {
        flex-direction: column;
    }
    
    .playing .game-bar {
        top: unset;
        bottom: 0;
        z-index: 1;
    }
    
    .playing .ponies-list-container {
        position: sticky;
        bottom: v-bind('gameBarHeight');
    }
}

.win-body {
    text-align: center;
}

.dialog-options {
    display: flex;
    flex-direction: column;
    width: max-content;
}
</style>
