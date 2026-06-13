<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue'
import { language } from '@/globals'
import { CATEGORIES, LOCATIONS } from '@/scripts/categories'
import { any, downloadFile } from '@/scripts/common'
import { groupQuests, getObject, translateName } from '@/scripts/gameData'
import { useSaveStore } from '@/stores/saveManager'
import type { CategoryName, GameObjectId } from '@/types/gameDataTypes'
import Papa from 'papaparse'
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const saveStore = useSaveStore()

const { t } = useI18n()

type Format = 'csv' | 'json'
const format = ref<Format>('csv')

const category = ref<CategoryName>('pony')

function exportSave() {
    let result: string = ''
    let filename: string = ''
    let type: string = 'application/*'

    
    switch (format.value) {
        case 'csv':
            result = exportCSV()
            filename = `${t(CATEGORIES[category.value].string, 2)}.csv`
            type = 'application/csv'
            break
        case 'json':
            result = exportJSON()
            break
    }

    downloadFile(result, type, filename)
}

function exportCSV() {
    const table: Record<string, string | number>[] = []
    switch (category.value) {
        case 'pony':
            for (let [ponyId, ponyInfo] of Object.entries(saveStore.ponies)) {
                const pony = getObject(ponyId, 'pony')
                if (pony.group.length > 0 && !pony.group_master) {
                    continue
                }

                const house = getObject(pony.house, 'house')
                const houseName = house !== null ? translateName(house).value : ''

                const pro = []

                for (let quest of pony.pro) {
                    if (quest === 'random') {
                        pro.push(t('group_quests.random_pro'))
                    } else {
                        pro.push(groupQuests.quests[quest].name[language.value.key])
                    }
                }

                let changeling = ''

                if (pony.changeling.id) {
                    const changeling_pony = getObject(pony.changeling.id, 'pony')
                    changeling = translateName(changeling_pony).value
                }

                const row = {
                    id: pony.id,
                    name: translateName(pony).value,
                    location: t(LOCATIONS[pony.location].string),
                    house: houseName,
                    stars: ponyInfo.level as number,
                    pro: pro.join(','),
                    transform: changeling,
                }

                table.push(row)
            }
            break
        case 'house':
            for (let houseId of saveStore.houses) {
                const house = getObject(houseId, 'house')
                table.push({
                    id: house.id,
                    name: translateName(house).value,
                    location: new Intl.ListFormat(language.value.code, {
                            style: 'narrow',
                        })
                        .format(house.location.map(l => t(LOCATIONS[l].string))),
                })
            }
            break
        case 'shop':
            for (let shopId of Object.keys(saveStore.shops)) {
                const shop = getObject(shopId, 'shop')

                interface ShopRow {
                    id: GameObjectId,
                    name: string,
                    location: string,
                    bits: number,
                    gems: number,
                    xp: number,
                    time: number,
                }

                let product = getObject(shop.product, 'consumable')
                if (any(Object.values(product.consume))) {
                    continue
                }
                
                table.push({
                    id: shopId,
                    name: translateName(shop).value,
                    location: t(LOCATIONS[shop.location].string),
                    bits: product.consume.bits,
                    gems: product.consume.gems,
                    xp: product.consume.xp,
                    time: product.time,
                })
            }
            break
    }

    return Papa.unparse(table)
}

function exportJSON() {
    let result = {
        player_info: {
            friend_code: saveStore.playerInfo.friendCode,
            join_date: saveStore.playerInfo.joinDate,
            total_playtime: saveStore.playerInfo.totalPlaytime,
        },
        inventory: {
            ponies: {},
            houses: saveStore.houses,
            shops: {},
        },
    }

    for (let [ponyId, ponyInfo] of Object.entries(saveStore.ponies)) {
        const pony = getObject(ponyId, 'pony')

        result.inventory.ponies[ponyId] = {
            id: pony.id,
            name: translateName(pony).value,
            stars: ponyInfo.level,
            location: pony.location,
            house: pony.house,

        }
    }

    return JSON.stringify(result, null, 2)
}


const exportDialog = useTemplateRef('export-dialog')

defineExpose({
    open: () => exportDialog.value.open(),
    close: () => exportDialog.value.close(),
    submit: () => exportDialog.value.submit(),
    cancel: () => exportDialog.value.cancel(),
})

</script>

<template>
    <DialogComponent
        :title="$t('common.export')"
        ref="export-dialog"
        has-close-button
    >

        <div class="import-body">
            <label>
                {{ $t('inventory.message.dialog.export.format') }}
                <select class="dropdown" v-model="format">
                    <option value="csv" selected>CSV</option>
                    <option value="json" disabled>Json</option>
                </select>
            </label>
            <div v-if="format == 'csv'">
                <label>
                    {{ $t('inventory.message.dialog.export.category') }}
                    <select class="dropdown" v-model="category">
                        <option value="pony">{{ $t('game_object.pony.pony', 2) }}</option>
                        <option value="house">{{ $t('game_object.house.house', 2) }}</option>
                        <option value="shop">{{ $t('game_object.shop.shop', 2) }}</option>
                    </select>
                </label>
            </div>
        </div>

        <template #menu>
            <button
                ref="export-button"
                @click="exportSave"
                class="button button-blue"
            >{{ $t('common.export') }}</button>
        </template>
    </DialogComponent>
</template>
