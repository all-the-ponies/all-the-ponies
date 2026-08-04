<script setup lang="ts">
import WeblateButton from '@/components/buttons/socials/WeblateButton.vue';
import Link from '@/components/Link.vue';
import DialogNotice from '@/components/notice/DialogNotice.vue';
import Notice from '@/components/notice/Notice.vue';
import links from '@/globals/links';
import { getGameVersions } from '@/scripts/gameData';

const gameVersions = getGameVersions()

</script>

<template>
    <Notice noticeId="corrupt-save" hidden>
        <div class="notice-container">
            <div class="main-body">
                <div class="body">
                    <h2>{{ $t('notices.corrupt_save.title') }}</h2>
                    <p>{{ $t('notices.corrupt_save.body') }}</p>
                </div>
                <div class="buttons">
                    <Link class="notice-button button button-blue" href="/check-save/">{{ $t('notices.corrupt_save.button') }}</Link>
                </div>
            </div>
        </div>
    </Notice>
    <Notice noticeId="help-wanted2">
        <div class="notice-container">
            <div class="main-body">
                <div class="body">
                    <h2>{{ $t('notices.help_wanted.title') }}</h2>
                    <p>{{ $t('notices.help_wanted.body') }}</p>
                </div>
                <div class="buttons">
                    <WeblateButton class="notice-button" :href="links.weblate">Weblate</WeblateButton>
                </div>
            </div>
        </div>
    </Notice>
    <DialogNotice
        notice-id="v5_arks_fixed"
        :title="$t('notices.v5_arks_cracked.title')"
    >
        {{ $t('notices.v5_arks_cracked.body', {version: gameVersions.game_version}) }}
    </DialogNotice>
</template>

<style lang="scss" scoped>
.notice-container {
    container-type: inline-size;

    .main-body {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    
        .body {
            min-width: 3rem;
        }

        .buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
        }
    
        .notice-button {
            margin-top: 0;
            width: max-content;
            margin-inline: auto;
            white-space: nowrap;
        }
    }
    
    @container (width < 30rem) {
      .main-body {
        flex-wrap: wrap;
        gap: 1rem;
      }
    }
}



</style>
