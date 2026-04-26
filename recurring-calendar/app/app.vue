<script setup lang="ts">
import type { Cycle } from '~~/prisma/generated/client'

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const occurrences = ref<CalendarEventOccurrence[]>([])
const isLoading = ref(false)

const scheduleForm = reactive({
  title: '',
  date: '',
  isRecurring: false,
  type: 'DAILY' as Cycle,
  cycle: 1,
  endDate: '',
})

const recurrenceTypes = [
  { label: 'Day', value: 'DAILY' as const },
  { label: 'Week', value: 'WEEKLY' as const },
  { label: 'Month', value: 'MONTHLY' as const },
  { label: 'Year', value: 'YEARLY' as const },
]

const calendarDays = computed(() => {
  const monthStart = new Date(year.value, month.value - 1, 1)
  const monthEnd = new Date(year.value, month.value, 0)
  const visibleStart = new Date(monthStart)
  visibleStart.setDate(visibleStart.getDate() - visibleStart.getDay())
  const visibleEnd = new Date(monthEnd)
  visibleEnd.setDate(visibleEnd.getDate() + (6 - visibleEnd.getDay()))

  const days: string[] = []
  const cursor = new Date(visibleStart)

  while (cursor <= visibleEnd) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
})

const groupedByDay = computed<Record<string, CalendarEventOccurrence[]>>(() => {
  const grouped: Record<string, CalendarEventOccurrence[]> = {}

  for (const item of occurrences.value) {
    if (!grouped[item.occurrenceDate]) {
      grouped[item.occurrenceDate] = []
    }

    grouped[item.occurrenceDate]!.push(item)
  }

  return grouped
})

function isCurrentMonth(isoDate: string) {
  const date = new Date(isoDate)
  return date.getMonth() + 1 === month.value
}

function toDisplayDay(isoDate: string) {
  return new Date(isoDate).getDate()
}

async function fetchEvents() {
  const validated = await getEventsBody.safeParseAsync({ year: year.value, month: month.value })

  if (!validated.success) {
    alert(validated.error.issues.map(issue => issue.message).join('\n'))
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch<CalendarEventOccurrence[]>('/api/events', {
      method: 'GET',
      query: validated.data,
    })

    occurrences.value = response
  }
  finally {
    isLoading.value = false
  }
}

async function createSchedule() {
  const payload = {
    title: scheduleForm.title,
    date: scheduleForm.date,
    ...(scheduleForm.isRecurring
      ? {
          type: scheduleForm.type,
          cycle: scheduleForm.cycle,
          endDate: scheduleForm.endDate,
        }
      : {}),
  }

  const validated = await createEventBody.safeParseAsync(payload)

  if (!validated.success) {
    alert(validated.error.issues.map(issue => issue.message).join('\n'))
    return
  }

  await $fetch('/api/events', {
    method: 'POST',
    body: validated.data,
  })

  scheduleForm.title = ''
  scheduleForm.date = ''
  scheduleForm.isRecurring = false
  scheduleForm.type = 'DAILY'
  scheduleForm.cycle = 1
  scheduleForm.endDate = ''

  await fetchEvents()
}

onMounted(() => {
  void fetchEvents()
})
</script>

<template>
  <main>
    <section>
      <form @submit.prevent="fetchEvents">
        <label>
          Year
          <input
            v-model.number="year"
            type="number"
            min="1900"
            max="2100"
            required
          >
        </label>
        <label>
          Month
          <input
            v-model.number="month"
            type="number"
            min="1"
            max="12"
            required
          >
        </label>
        <button>Update</button>
      </form>

      <div class="weekdays">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>

      <div class="calendar-grid">
        <article
          v-for="isoDay in calendarDays"
          :key="isoDay"
          class="day-cell"
          :class="{ muted: !isCurrentMonth(isoDay) }"
        >
          <div class="day-number">
            {{ toDisplayDay(isoDay) }}
          </div>

          <ul class="events">
            <li
              v-for="item in groupedByDay[isoDay] ?? []"
              :key="`${item.eventId}-${item.occurrenceDate}`"
              class="event"
              :title="item.isRecurring ? 'Recurring event' : 'One-time event'"
            >
              {{ item.title }}
            </li>
          </ul>
        </article>
      </div>

      <p v-if="isLoading">
        Loading schedules...
      </p>
    </section>

    <section>
      <form @submit.prevent="createSchedule">
        <label>
          Title
          <input
            v-model.trim="scheduleForm.title"
            type="text"
            required
          >
        </label>

        <label>
          Task Date
          <input
            v-model="scheduleForm.date"
            type="date"
            required
          >
        </label>

        <label>
          <input
            v-model="scheduleForm.isRecurring"
            type="checkbox"
          >
          Is recurring
        </label>

        <template v-if="scheduleForm.isRecurring">
          <label>
            Type
            <select v-model="scheduleForm.type">
              <option
                v-for="typeOption in recurrenceTypes"
                :key="typeOption.value"
                :value="typeOption.value"
              >
                {{ typeOption.label }}
              </option>
            </select>
          </label>

          <label>
            Cycle
            <input
              v-model.number="scheduleForm.cycle"
              type="number"
              min="1"
              required
            >
          </label>

          <label>
            End Date
            <input
              v-model="scheduleForm.endDate"
              type="date"
              required
            >
          </label>
        </template>

        <button>Add schedule</button>
      </form>
    </section>
  </main>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: 13px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.day-cell {
  min-height: 8rem;
  border: 1px solid #ddd;
  padding: 0.5rem;
}

.day-number {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.events {
  display: grid;
  gap: 0.5rem;
}

.event {
  list-style: none;
  padding: 0.5rem;
  background-color: blue;
  color: white;
}

.muted {
  opacity: 0.5;
}
</style>
