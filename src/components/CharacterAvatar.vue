<template>
  <div class="character-avatar" :class="`mode-${mode}`" :style="containerStyle" v-html="avatarSvg"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

const props = withDefaults(defineProps<{
  size?: number;
  height?: number;
  seed?: string;
  // Avataaars Options
  top?: string; // Hair/Hat
  clothing?: string;
  clothesColor?: string;
  accessories?: string;
  accessoriesColor?: string;
  eyes?: string;
  eyebrows?: string;
  mouth?: string;
  skinColor?: string;
  hairColor?: string;
  hatColor?: string;
  backgroundColor?: string;
  mode?: 'face' | 'full';
}>(), {
  size: 100,
  mode: 'full'
});

const containerStyle = computed(() => ({
  width: props.size + 'px',
  height: (props.height || props.size) + 'px',
}));

const avatarSvg = computed(() => {
  const options: any = {
    seed: props.seed,
    size: props.size,
    radius: 0,
    backgroundColor: props.backgroundColor ? [props.backgroundColor] : ['b6e3f4'],
    skinColor: props.skinColor ? [props.skinColor] : undefined,
    top: props.top ? [props.top] : undefined,
    topProbability: 100, // Force top to always show
    hairColor: props.hairColor ? [props.hairColor] : undefined,
    hatColor: props.hatColor ? [props.hatColor] : undefined,
    clothing: props.clothing ? [props.clothing] : undefined,
    clothesColor: props.clothesColor ? [props.clothesColor] : undefined,
    eyes: props.eyes ? [props.eyes] : undefined,
    eyebrows: props.eyebrows ? [props.eyebrows] : undefined,
    mouth: props.mouth ? [props.mouth] : undefined,
    accessories: props.accessories ? [props.accessories] : undefined,
    accessoriesProbability: 100, // Force accessories to always show
    accessoriesColor: props.accessoriesColor ? [props.accessoriesColor] : undefined,
  };

  const avatar = createAvatar(avataaars, options);

  return avatar.toString();
});
</script>

<style scoped>
.character-avatar {
  display: inline-block;
  overflow: hidden;
  border-radius: 12px;
  position: relative;
}

/* Deep selector to target the SVG inside v-html */
.character-avatar :deep(svg) {
  transition: transform 0.3s ease;
  width: 100%;
  height: auto; /* Maintain aspect ratio of SVG */
  display: block;
}

/* Portrait Mode: Vertical frame */
.character-avatar.mode-face :deep(svg) {
  /* Show full body without zoom to ensure nothing is cut off */
  transform: scale(1) translateY(0);
  transform-origin: top center;
}

/* Full Body Mode: Show everything */
.character-avatar.mode-full :deep(svg) {
  transform: scale(1);
}
</style>
