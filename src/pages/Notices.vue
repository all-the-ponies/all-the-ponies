<script setup lang="ts">
import DiscordButton from '@/components/buttons/socials/DiscordButton.vue';
import Notice from '@/components/notice/Notice.vue'
import links from '@/globals/links';

</script>

<template>
    <Notice noticeId="help-wanted">
        <div class="help-wanted-container">
            <div class="help-wanted">
                <div class="body">
                    <h2>{{ $t('notices.help_wanted.title') }}</h2>
                    <p>{{ $t('notices.help_wanted.body') }}</p>
                </div>
                <div>
                    <DiscordButton class="discord-button" :href="links.discordServer">{{ $t('notices.help_wanted.discord') }}</DiscordButton>
                </div>
            </div>
        </div>
    </Notice>
</template>

<style lang="css" scoped>
.help-wanted-container {
    container-type: inline-size;

    .help-wanted {
        display: flex;
        align-items: center;
    
        .body {
            min-width: 3rem;
        }
    
        .discord-button {
            width: max-content;
            margin-inline: auto;
        }
    }
    
    @container (width < 30rem) {
      .help-wanted {
        flex-wrap: wrap;
      }
    }
}



</style>
