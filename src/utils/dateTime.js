export function combineDateAndTime(date, time) {
  const offsetMinutes = Number(process.env.APP_TIMEZONE_OFFSET_MINUTES ?? 180);
  const utcAsLocal = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    time.getUTCHours(),
    time.getUTCMinutes(),
    time.getUTCSeconds(),
  );
  return new Date(utcAsLocal + offsetMinutes * 60 * 1000);
}

export function currentLocalDate() {
  const offsetMinutes = Number(process.env.APP_TIMEZONE_OFFSET_MINUTES ?? 180);
  const localNow = new Date(Date.now() - offsetMinutes * 60 * 1000);
  return new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()));
}
