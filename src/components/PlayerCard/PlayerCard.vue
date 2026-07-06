<script lang="ts" setup>
import playerNames from '@/assets/json/player_names.json'
import { language } from '@/globals';
import { createAssetUrl } from '@/scripts/assets';
import { getObject } from '@/scripts/gameData';
import type { AvatarFrameType, AvatarType, BackgroundFrameType, BackgroundType, CutieMarkType, GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computed } from 'vue';
import LevelImage from './LevelImage.vue';
import PlayerStat from './PlayerStat.vue';
import XPProgress from './XPProgress.vue';
import type { PlayerStatName } from '@/scripts/api.types.ts';

const props = defineProps<{
    friendCode: string,
    level: number,
    xp: number,
    requiredXp: number,
    leftName: string,
    rightName: string,
    avatar: AvatarType | GameObjectId,
    avatarFrame: AvatarFrameType | GameObjectId,
    background: BackgroundType | GameObjectId,
    backgroundFrame: BackgroundFrameType | GameObjectId,
    cutieMark: CutieMarkType | GameObjectId,
    leftStat?: {
        type: PlayerStatName,
        value: number,
    },
    rightStat?: {
        type: PlayerStatName,
        value: number,
    },
}>()

const friendCode = computed(() => props.friendCode)
const name = computed(() => {
    const left = playerNames[props.leftName][language.value.key]
    const right = playerNames[props.rightName][language.value.key]

    return `${left} ${right}`
})

const level = computed(() => props.level)
const xp = computed(() => props.xp)
const requiredXp = computed(() => props.requiredXp)

const avatar = computed(() => getObject(props.avatar, 'avatar'))
const avatarFrame = computed(() => getObject(props.avatarFrame, 'avatar_frame'))
const background = computed(() => getObject(props.background, 'background'))
const backgroundFrame = computed(() => getObject(props.backgroundFrame, 'background_frame'))
const cutieMark = computed(() => getObject(props.cutieMark, 'cutie_mark'))

const leftStat = computed(() => props.leftStat)
const rightStat = computed(() => props.rightStat)

const backgroundImage = computed(() => createAssetUrl(background.value?.image.preview.path))
const backgroundFrameImage = computed(() => createAssetUrl(backgroundFrame.value?.image.main.path))
const avatarImage = computed(() => createAssetUrl(avatar.value?.image.main.path))
const avatarFrameImage = computed(() => createAssetUrl(avatarFrame.value?.image.main.path))
const cutieMarkImage = computed(() => createAssetUrl(cutieMark.value?.image.main.path))


</script>

<template>
    <svg
        viewBox="0 0 114.3 31.485416"
        class="player-card-container"
    >

        <!-- width="432"
        height="119" -->
        <g class="background-group">
            <image
                :href="backgroundImage"
                preserveAspectRatio="none"
                x="0.79374999"
                y="1.0583333"
                width="112.97708"
                height="29.633333"
            ></image>
            <image
                :href="backgroundFrameImage"
                preserveAspectRatio="none"
                x="0"
                y="0"
                width="114.34178"
                height="31.485416"
            ></image>
        </g>

        <g class="avatar-group">
            <image
                :href="avatarImage"
                preserveAspectRatio="none"
                x="5.102973"
                y="4.7078791"
                width="20.901543"
                height="22.000309"
            ></image>
            <image
                :href="avatarFrameImage"
                preserveAspectRatio="none"
                x="4.2817602"
                y="4.0973516"
                width="22.292274"
                height="22.744965"
            ></image>
        </g>
        <text
            class="name"
            fill="#3c285c"
            x="30.219557"
            y="9.1718235"
        >
            <tspan>{{ name }}</tspan>
        </text>

        <g
            class="cutie-mark-group"
        >
            <!-- <rect
                x="93.2462785"
                y="11.024493"
                width="16.204844"
                height="16.204844"
                fill="black"
            >

            </rect> -->
            <image
                :href="cutieMarkImage"
                x="93.2462785"
                y="11.024493"
                width="16.204844"
                height="16.204844"
            ></image>
        </g>

        <g class="level-group">
            <g
                class="xp-bar"
            >
                <XPProgress
                    :value="xp"
                    :max="requiredXp"
                    transform="matrix(0.11305128,0,0,0.14288889,79.880273,4.1580001)"
                ></XPProgress>
            </g>
            <g>
                <LevelImage
                    :level="level"
                    x="70.198265"
                    y="-2.3898842"
                    width="18.098351"
                    height="18.098351"
                ></LevelImage>
            </g>
        </g>

        <g class="player-stats">
            <PlayerStat
                v-if="leftStat && leftStat.type"
                :stat="leftStat.type"
                :count="leftStat.value"
                x="40.217"
                y="15.4"
            ></PlayerStat>
            <PlayerStat
                v-if="rightStat && rightStat.type"
                :stat="rightStat.type"
                :count="rightStat?.value"
                x="65.352"
                y="15.4"
            ></PlayerStat>
        </g>
    </svg>
</template>

<style lang="css" scoped>

.name {
    font-size: 6.06567px;
    line-height: 0.9;
    font-family: 'Celestia Redux';
    fill: #351858;
    stroke: #efefef;
    stroke-width: 0.423333;
    stroke-linecap: round;
    stroke-linejoin: miter;
    stroke-dasharray: none;
    paint-order: stroke fill markers;
}

</style>
