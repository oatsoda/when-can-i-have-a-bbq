import {
  hourIsInPast,
  hoursBetween,
  millisecondsInHours,
} from "../core/dateFunctions";
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
  hoursOfTheDay: number[];
};

export const defaultSettings: Settings = {
  excludeNight: true,
  excludeInclementWeather: true,
  minTemperature: 16,
  maxPrecipitationChance: 30,
  maxPrecipitationAmount: 0.1,
  maxCloudcover: 50,
  minHours: 2,
  daysOfTheWeek: [0, 6],
  hoursOfTheDay: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
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
  console.warn("Weather Data:", weatherResponse);

  const data = weatherResponse.hourly;
  const totalHours = data.time.length;

  if (totalHours === 0) {
    return [];
  }

  // 1. Remove any unsuitable weather

  const suitableHours: number[] = [];
  const now = new Date();
  for (let hour = 0; hour < totalHours; hour++) {
    const thisDate = new Date(data.time[hour]);
    if (hourIsInPast(now, thisDate)) {
      // Exclude hours in the past
      continue;
    }
    if (!settings.daysOfTheWeek.includes(thisDate.getDay())) {
      continue;
    }
    if (!settings.hoursOfTheDay.includes(thisDate.getHours())) {
      continue;
    }
    console.log(data.time[hour]);
    if (settings.excludeNight && data.is_day[hour] === 0) {
      console.log("Is nighttime");
      continue;
    }
    if (settings.excludeInclementWeather && data.weathercode[hour] > 3) {
      console.log("Has inclement weather", data.weathercode[hour]);
      continue;
    }
    if (data.temperature_2m[hour] < settings.minTemperature) {
      console.log("Is too cold", data.temperature_2m[hour]);
      continue;
    }
    // TODO: Improve this - the combinations need finessing
    if (
      data.precipitation_probability[hour] > settings.maxPrecipitationChance ||
      data.precipitation[hour] > settings.maxPrecipitationAmount
    ) {
      console.log(
        "Too much precip",
        data.precipitation_probability[hour],
        data.precipitation[hour]
      );
      continue;
    }
    if (data.cloudcover[hour] >= settings.maxCloudcover) {
      console.log("Too much cloud cover", data.cloudcover[hour]);
      continue;
    }

    console.log("Suitable!");
    suitableHours.push(hour);
  }

  console.log("------- SUITABLE HOURS ----------", suitableHours);

  if (suitableHours.length === 0) {
    return [];
  }

  // 2. Group suitable times into contiguous periods

  function addSuitableTime(group: TimeGroup) {
    // The forecast time is for the "previous hour"
    const from = group.timeFrom;
    from.setTime(from.getTime() - millisecondsInHours);
    const suitableTime: SuitableTime = {
      timeFrom: from,
      timeTo: group.timeTo,
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
    if (!currentGroup) {
      currentGroup = {
        timeFrom: new Date(data.time[hour] + "Z"),
        timeTo: new Date(data.time[hour] + "Z"),
        dataIndexes: [hour],
      };
    } else {
      var time = new Date(data.time[hour] + "Z");
      // If contiguous hours has ended
      if (hoursBetween(currentGroup.timeTo, time) > 1) {
        // Ignore if there aren't enough hours
        if (currentGroup.dataIndexes.length >= settings.minHours) {
          addSuitableTime(currentGroup);
        }

        currentGroup = {
          timeFrom: new Date(data.time[hour] + "Z"),
          timeTo: new Date(data.time[hour] + "Z"),
          dataIndexes: [hour],
        };
      } else {
        currentGroup.timeTo = new Date(data.time[hour] + "Z");
        currentGroup.dataIndexes.push(hour);
      }
    }
    console.log(
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

  /*
          TODO
          Filter our cooler temperatures if there are better ones (i.e. only LOW scores)
          Warn on high UV Index
         */

  return suitableTimes;
}
