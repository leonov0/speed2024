<script setup lang="ts">
type RectInfo = {
  left: number
  top: number
  width: number
  height: number
}

const route = useRoute()
const videos = Array.from({ length: 8 }, (_, i) => `video${i + 1}`)
const fullscreenRect = computed<RectInfo>(() => ({
  left: 0,
  top: 0,
  width: window.innerWidth,
  height: window.innerHeight,
}))

const boxRefs = ref<Record<string, HTMLElement | null>>({})
const activeName = ref('')
const activeRect = reactive<RectInfo>({ left: 0, top: 0, width: 0, height: 0 })
const isAnimating = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const currentVideoId = computed(() => {
  const value = route.query.videoId
  return typeof value === 'string' && value.length > 0 ? value : ''
})

function getVideoSrc(name: string) {
  return `/videos/${name}.mp4`
}

function setBoxRef(name: string, el: Element | null) {
  boxRefs.value[name] = el as HTMLElement | null
}

function getBoxRect(name: string): RectInfo | null {
  const box = boxRefs.value[name]
  if (!box) return null

  const { left, top, right, bottom } = box.getBoundingClientRect()
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  }
}

function animateRect(before: RectInfo, after: RectInfo) {
  isAnimating.value = false
  Object.assign(activeRect, before)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isAnimating.value = true
      Object.assign(activeRect, after)
    })
  })
}

function videoLink(name: string) {
  if (currentVideoId.value === name) return { query: {} }
  return { query: { videoId: name } }
}

function itemClasses(name: string) {
  const isSelected = currentVideoId.value === name
  return [
    !currentVideoId.value || isSelected ? 'visible' : 'hidden',
    activeName.value === name ? 'fullscreen' : '',
    activeName.value === name && isAnimating.value ? 'animating' : '',
  ]
}

function positionStyle(name: string) {
  if (activeName.value !== name) return {}

  return {
    left: `${activeRect.left}px`,
    top: `${activeRect.top}px`,
    width: `${activeRect.width}px`,
    height: `${activeRect.height}px`,
  }
}

watch(
  currentVideoId,
  (newName, oldName) => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }

    if (newName) {
      const from = getBoxRect(newName)
      if (!from) return

      activeName.value = newName
      animateRect(from, fullscreenRect.value)
      return
    }

    if (!oldName) return

    const to = getBoxRect(oldName)
    if (!to) return

    animateRect(fullscreenRect.value, to)

    closeTimer = setTimeout(() => {
      activeName.value = ''
      isAnimating.value = false
    }, 300)
  },
)

onMounted(() => {
  if (currentVideoId.value) {
    activeName.value = currentVideoId.value
    Object.assign(activeRect, fullscreenRect.value)
  }

  window.addEventListener('resize', syncFullscreenRect)
})

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
  window.removeEventListener('resize', syncFullscreenRect)
})

function syncFullscreenRect() {
  if (!activeName.value) return
  Object.assign(activeRect, fullscreenRect.value)
}
</script>

<template>
  <div class="container">
    <div
      v-for="name in videos"
      :key="name"
      :ref="(element) => setBoxRef(name, element as Element)"
      class="video-box"
    >
      <NuxtLink
        :to="videoLink(name)"
        class="video-item"
        :class="itemClasses(name)"
        :style="positionStyle(name)"
      >
        <video
          :src="getVideoSrc(name)"
          loop
          muted
          autoplay
          playsinline
        />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.video-box {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.video-item {
  display: block;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s;
}

.video-item.hidden {
  opacity: 0;
  pointer-events: none;
}

.video-item.visible {
  opacity: 1;
}

.video-item.fullscreen {
  position: fixed;
  z-index: 2;
}

.video-item.animating {
  transition: left 0.3s, top 0.3s, width 0.3s, height 0.3s, opacity 0.3s;
}

video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
