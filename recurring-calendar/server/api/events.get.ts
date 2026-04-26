import type { Event } from '~~/prisma/generated/client'

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(baseDate: Date, months: number, desiredDay: number) {
  const year = baseDate.getFullYear()
  const monthIndex = baseDate.getMonth() + months
  const targetYear = year + Math.floor(monthIndex / 12)
  const targetMonth = ((monthIndex % 12) + 12) % 12
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const day = Math.min(desiredDay, lastDay)
  return new Date(targetYear, targetMonth, day)
}

function addYears(baseDate: Date, years: number, desiredDay: number) {
  const targetYear = baseDate.getFullYear() + years
  const targetMonth = baseDate.getMonth()
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const day = Math.min(desiredDay, lastDay)
  return new Date(targetYear, targetMonth, day)
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function createOccurrence(event: Event, occurrenceDate: Date): CalendarEventOccurrence {
  return {
    eventId: event.id,
    title: event.title,
    originalDate: toIsoDate(event.date),
    occurrenceDate: toIsoDate(occurrenceDate),
    isRecurring: Boolean(event.type),
  }
}

function getMonthlyVisibleRange(year: number, month: number) {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const rangeStart = addDays(monthStart, -monthStart.getDay())
  const rangeEnd = addDays(monthEnd, 6 - monthEnd.getDay())

  return {
    rangeStart: startOfDay(rangeStart),
    rangeEnd: endOfDay(rangeEnd),
  }
}

function expandRecurringEvent(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEventOccurrence[] {
  if (!event.type || !event.cycle || !event.endDate) {
    return []
  }

  const occurrences: CalendarEventOccurrence[] = []
  const eventStart = startOfDay(event.date)
  const recurrenceEnd = endOfDay(event.endDate)
  const desiredDay = eventStart.getDate()
  let occurrence = eventStart
  let step = 0

  while (occurrence <= rangeEnd && occurrence <= recurrenceEnd) {
    if (occurrence >= rangeStart) {
      occurrences.push(createOccurrence(event, occurrence))
    }

    step += 1

    if (event.type === 'DAILY') {
      occurrence = addDays(eventStart, step * event.cycle)
      continue
    }

    if (event.type === 'WEEKLY') {
      occurrence = addDays(eventStart, step * event.cycle * 7)
      continue
    }

    if (event.type === 'MONTHLY') {
      occurrence = addMonths(eventStart, step * event.cycle, desiredDay)
      continue
    }

    occurrence = addYears(eventStart, step * event.cycle, desiredDay)
  }

  return occurrences
}

function getNonRecurringOccurrence(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEventOccurrence[] {
  const date = startOfDay(event.date)

  if (date < rangeStart || date > rangeEnd) {
    return []
  }

  return [createOccurrence(event, date)]
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, getEventsBody.parse)
  const { rangeStart, rangeEnd } = getMonthlyVisibleRange(query.year, query.month)

  const events = await prisma.event.findMany({
    where: {
      date: {
        lte: rangeEnd,
      },
      OR: [
        {
          type: null,
        },
        {
          type: {
            not: null,
          },
          endDate: {
            gte: rangeStart,
          },
        },
      ],
    },
    orderBy: {
      id: 'asc',
    },
  })

  const occurrences = events.flatMap((item) => {
    if (!item.type || !item.cycle || !item.endDate) {
      return getNonRecurringOccurrence(item, rangeStart, rangeEnd)
    }

    return expandRecurringEvent(item, rangeStart, rangeEnd)
  }).filter((item, index, array) => {
    return array.findIndex((other) => {
      return other.eventId === item.eventId
        && other.occurrenceDate === item.occurrenceDate
        && isSameDay(new Date(other.occurrenceDate), new Date(item.occurrenceDate))
    }) === index
  })

  return occurrences.sort((left, right) => {
    if (left.occurrenceDate === right.occurrenceDate) {
      return left.eventId - right.eventId
    }

    return left.occurrenceDate.localeCompare(right.occurrenceDate)
  })
})
