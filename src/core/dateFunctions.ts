export const millisecondsInHours = 60 * 60 * 1000;

export function hoursBetween(start: Date, end: Date): number {
  return (end.valueOf() - start.valueOf()) / millisecondsInHours;
}

export function hourIsInPast(now: Date, target: Date): boolean {
  return hoursBetween(now, target) <= 0;
}

export function formatDate(date: Date, now: Date) {
  var dayOfMonth = date.getDate();
  let formatted = `${days[date.getDay()]} ${dayOfMonth}${nthNumber(
    dayOfMonth
  )}`;
  if (now.getMonth() !== date.getMonth()) {
    formatted += ` ${months[date.getMonth()]}`;
  }
  if (now.getFullYear() !== date.getFullYear()) {
    formatted += ` ${date.getFullYear()}`;
  }
  return formatted;
}

export function formatTime(date: Date) {
  const hour = date.getHours();
  if (hour === 0) return "Midnight";
  if (hour === 12) return "Noon";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

export function formatTimes(from: Date, to: Date) {
  return `${formatTime(from)} - ${formatTime(to)}`;
}

export const nthNumber = (number: number) => {
  if (number > 3 && number < 21) {
    return "th";
  }
  switch (number % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const months = [
  "Jan",
  "Febr",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
