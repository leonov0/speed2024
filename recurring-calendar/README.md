# Nuxt Starter

The player must create a recurring calendar. The schedules should be managed in a database, with each schedule (including recurring ones) having a single row.

You can select the Title, Task Date, and Is recurring, and only if recurrence is enabled, you can input the Type, Cycle, and End Date. (The calendar may include parts of the previous month and the next month.)

Type can be one of Day, Week, Month, or Year, and the schedule will repeat every Cycle number of Types.
(e.g., if Type is Week and Cycle is 2, the schedule repeats every 2 weeks.)

If the date of a recurring schedule exceeds the last day of the month in which it should appear, it will be displayed on the last day of that month.

Users can change the year and month of the displayed calendar.

## 1. Prerequisites

- Node 24

## 2. Configuration

```bash
cp .env.example .env
```

## 5. Production

```bash
npm install
npx prisma db push
npm run build
npm run preview
```