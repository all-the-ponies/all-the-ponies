<script setup lang="ts">
import DiscordButton from '@/components/buttons/socials/DiscordButton.vue';
import Link from '@/components/Link.vue';
import Notice from '@/components/notice/Notice.vue'
import links from '@/globals/links';

</script>

<template>
    <Notice noticeId="corrupt-save">
        <div class="notice-container">
            <div class="main-body">
                <div class="body">
                    <h2>{{ $t('notices.corrupt_save.title') }}</h2>
                    <p>{{ $t('notices.corrupt_save.body') }}</p>
                </div>
                <div>
                    <Link class="notice-button button button-blue" href="/check-save/">{{ $t('notices.corrupt_save.button') }}</Link>
                </div>
            </div>
        </div>
    </Notice>
    <Notice noticeId="help-wanted">
        <div class="notice-container">
            <div class="main-body">
                <div class="body">
                    <h2>{{ $t('notices.help_wanted.title') }}</h2>
                    <p>{{ $t('notices.help_wanted.body') }}</p>
                </div>
                <div>
                    <DiscordButton class="notice-button" :href="links.discordServer">{{ $t('notices.help_wanted.discord') }}</DiscordButton>
                </div>
            </div>
        </div>
    </Notice>
</template>

<style lang="css" scoped>
.notice-container {
    container-type: inline-size;

    .main-body {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    
        .body {
            min-width: 3rem;
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
