import { addHours, hourIsInPast, hoursBetween } from "../core/dateFunctions";
import { WeatherResponse } from "./weatherApi";

export type Settings = {
  excludeNight: boolean;
  excludeInclementWeather: boolean;
  minTemperature: number;
  maxPrecipitationChance: number;
  maxPrecipitationAmount: number;
  maxCloudcover: number;
  minHours: number;
  daysOfTheWeek: number[];
  periodsOfTheDay: PeriodOfDay[];
};

export type PeriodOfDay = "Small Hours" | "Morning" | "Afternoon" | "Evening";

export const periodsOfDay: PeriodOfDay[] = [
  "Small Hours",
  "Morning",
  "Afternoon",
  "Evening",
];

export const hoursOfPeriods = new Map<PeriodOfDay, number[]>([
  [periodsOfDay[0], [0, 1, 2, 3, 4, 5, 6, 7, 8]],
  [periodsOfDay[1], [9, 10, 11]],
  [periodsOfDay[2], [12, 13, 14, 15, 16, 17]],
  [periodsOfDay[3], [18, 19, 20, 21, 22, 23]],
]);

export const defaultSettings: Settings = {
  excludeNight: true,
  excludeInclementWeather: true,
  minTemperature: 16,
  maxPrecipitationChance: 30,
  maxPrecipitationAmount: 0.1,
  maxCloudcover: 50,
  minHours: 2,
  daysOfTheWeek: [0, 6],
  periodsOfTheDay: ["Afternoon", "Evening"],
};

type TimeGroup = {
  timeFrom: Date;
  timeTo: Date;
  dataIndexes: number[];
};

export type SuitableTime = {
  timeFrom: Date;
  timeTo: Date;
  hours: number;
  perfect: boolean;
  avg_temperature_2m: number;
  avg_precipitation_probability: number;
  avg_cloudcover: number;
  avg_weathercode: number;
  max_uv_index: number;
};

export function interpretWeather(
  weatherResponse: WeatherResponse,
  settings: Settings
): SuitableTime[] {
  console.debug("Weather Data:", weatherResponse);

  const data = weatherResponse.hourly;
  const totalHours = data.time.length;

  if (totalHours === 0) {
    return [];
  }

  // 1. Remove any unsuitable weather

  const suitableHours: number[] = [];
  const now = new Date();

  let hours: number[] = [];
  for (var period of settings.periodsOfTheDay) {
    hours.push(...hoursOfPeriods.get(period)!);
  }

  for (let hour = 0; hour < totalHours; hour++) {
    // Data from the API is for the *previous* hours weather, so 15:00 is 14:00-15:00
    // so we interpret user wanting to include 14:00 as the data from 15:00
    const thisDate = addHours(new Date(data.time[hour] + "Z"), -1);

    if (hourIsInPast(now, thisDate)) {
      // Exclude hours in the past
      continue;
    }
    if (!settings.daysOfTheWeek.includes(thisDate.getDay())) {
      continue;
    }

    if (!hours.includes(thisDate.getHours())) {
      continue;
    }
    console.debug(data.time[hour]);
    if (settings.excludeNight && data.is_day[hour] === 0) {
      console.debug("Is nighttime");
      continue;
    }
    if (settings.excludeInclementWeather && data.weathercode[hour] > 3) {
      console.debug("Has inclement weather", data.weathercode[hour]);
      continue;
    }
    if (data.temperature_2m[hour] < settings.minTemperature) {
      console.debug("Is too cold", data.temperature_2m[hour]);
      continue;
    }
    if (
      data.precipitation_probability[hour] > settings.maxPrecipitationChance ||
      data.precipitation[hour] > settings.maxPrecipitationAmount
    ) {
      console.debug(
        "Too much precip",
        data.precipitation_probability[hour],
        data.precipitation[hour]
      );
      continue;
    }
    if (data.cloudcover[hour] >= settings.maxCloudcover) {
      console.debug("Too much cloud cover", data.cloudcover[hour]);
      continue;
    }

    console.debug("Suitable!");
    suitableHours.push(hour);
  }

  console.debug("------- SUITABLE HOURS ----------", suitableHours);

  if (suitableHours.length === 0) {
    return [];
  }

  // 2. Group suitable times into contiguous periods

  function addSuitableTime(group: TimeGroup) {
    // Add one hour on to the end, as a single hour for 14:00 would mean 14:00-15:00
    // Note that the times have already been adjusted from the API.
    const to = addHours(group.timeTo, 1);
    const suitableTime: SuitableTime = {
      timeFrom: group.timeFrom,
      timeTo: to,
      hours: group.dataIndexes.length,
      perfect: false,
      avg_temperature_2m: 0,
      avg_precipitation_probability: 0,
      avg_cloudcover: 0,
      avg_weathercode: 0,
      max_uv_index: 0,
    };
    for (var hour of group.dataIndexes) {
      suitableTime.avg_temperature_2m += data.temperature_2m[hour];
      suitableTime.avg_precipitation_probability +=
        data.precipitation_probability[hour];
      suitableTime.avg_cloudcover += data.cloudcover[hour];
      suitableTime.avg_weathercode += data.weathercode[hour];
      suitableTime.max_uv_index = Math.max(
        suitableTime.max_uv_index,
        data.uv_index[hour]
      );
    }
    suitableTime.avg_temperature_2m /= suitableTime.hours;
    suitableTime.avg_precipitation_probability /= suitableTime.hours;
    suitableTime.avg_cloudcover /= suitableTime.hours;
    suitableTime.avg_weathercode /= suitableTime.hours;

    suitableTime.perfect =
      suitableTime.avg_weathercode === 0 &&
      suitableTime.avg_temperature_2m >= 20;

    suitableTimes.push(suitableTime);
  }

  const suitableTimes: SuitableTime[] = [];

  let currentGroup: TimeGroup | null = null;

  for (var hour of suitableHours) {
    // Data from the API is for the *previous* hours weather, so 15:00 is 14:00-15:00
    // so we interpret user wanting to include 14:00 as the data from 15:00
    const thisDate = addHours(new Date(data.time[hour] + "Z"), -1);

    if (!currentGroup) {
      currentGroup = {
        timeFrom: thisDate,
        timeTo: thisDate,
        dataIndexes: [hour],
      };
    } else {
      // If contiguous hours has ended
      if (hoursBetween(currentGroup.timeTo, thisDate) > 1) {
        // Ignore if there aren't enough hours
        if (currentGroup.dataIndexes.length >= settings.minHours) {
          addSuitableTime(currentGroup);
        }

        currentGroup = {
          timeFrom: thisDate,
          timeTo: thisDate,
          dataIndexes: [hour],
        };
      } else {
        currentGroup.timeTo = thisDate;
        currentGroup.dataIndexes.push(hour);
      }
    }
    console.debug(
      "CURRENT",
      currentGroup.dataIndexes.length.toString(),
      currentGroup.timeFrom.toString(),
      currentGroup.timeTo.toString()
    );
  }

  if (
    currentGroup &&
    currentGroup.dataIndexes.length >= settings.minHours // Ignore if there aren't enough hours
  ) {
    addSuitableTime(currentGroup);
  }

  return suitableTimes;
}
