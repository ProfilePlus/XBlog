export function parseDisplayDate(input: string | null | undefined) {
  if (!input) {
    return null;
  }

  const match = input.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (!match) {
    const value = Date.parse(input);
    return Number.isNaN(value) ? null : value;
  }

  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

export function displayDateToDate(input: string | null | undefined) {
  const value = parseDisplayDate(input);
  return value === null ? null : new Date(value);
}

export function formatDisplayDate(input: Date | string | null | undefined) {
  if (!input) {
    return "";
  }

  const value = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return `${value.getUTCFullYear()} 年 ${value.getUTCMonth() + 1} 月 ${value.getUTCDate()} 日`;
}

export function sortDateDesc<T>(items: T[], pickDate: (item: T) => string | null | undefined) {
  return [...items].sort((a, b) => {
    const aValue = parseDisplayDate(pickDate(a)) ?? 0;
    const bValue = parseDisplayDate(pickDate(b)) ?? 0;
    return bValue - aValue;
  });
}
