export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createEventBody.parse)

  const createdEvent = await prisma.event.create({
    data: {
      title: body.title,
      date: new Date(body.date),
      type: body.type ?? null,
      cycle: body.cycle ?? null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })

  return createdEvent
})
