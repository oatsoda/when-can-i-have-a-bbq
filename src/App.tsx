import { useCallback, useEffect, useMemo, useState } from "react";
import { Result } from "./components/Result";
import { LocationTypeahead } from "./components/LocationTypeahead";
import {
  hourIsInPast,
  hoursBetween,
  millisecondsInHours,
} from "./dateFunctions";

// https://open-meteo.com/en/docs?#latitude=51.1438656&longitude=-0.9911955&hourly=temperature_2m,precipitation_probability,precipitation,cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,uv_index,is_day,weathercode&windspeed_unit=mph&forecast_days=14

type WeatherResponse = {
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[]; // 	Air temperature at 2 meters above ground
    precipitation_probability: number[]; // Probability of precipitation with more than 0.1 mm of the preceding hour. Probability is based on ensemble weather models with 0.25° (~27 km) resolution. 30 different simulations are computed to better represent future weather conditions.
    precipitation: number[]; // Total precipitation (rain, showers, snow) sum of the preceding hour
    cloudcover: number[]; // Total cloud cover as an area fraction
    cloudcover_low: number[]; // Low level clouds and fog up to 3 km altitude
    cloudcover_mid: number[]; // Mid level clouds from 3 to 8 km altitude
    cloudcover_high: number[]; // High level clouds from 8 km altitude
    weathercode: number[]; // Weather condition as a numeric code. 0 = Clear Sky, 1, 2, 3 = Mainly clear, partly cloudy, and overcast. 45+ indicate less clement weather.
    uv_index: number[];
    is_day: number[]; // 1 if the current time step has daylight, 0 at night.
    // TODO: Add windspeed and windgusts
  };
};

type WeatherError = {
  error: boolean;
  reason: string;
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

export type Location = {
  latitude: number;
  longitude: number;
};

type Settings = {
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

const defaultSettings: Settings = {
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

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [geolocationPosition, setGeolocationPosition] = useState<
    Location | undefined
  >(undefined);
  const [geolocationPositionError, setGeolocationPositionError] = useState<
    GeolocationPositionError | undefined
  >(undefined);

  const [resultError, setResultError] = useState<string | undefined>(undefined);

  const [results, setResults] = useState<SuitableTime[] | undefined>(undefined);

  const locationClick = useCallback(() => {
    setIsLoading(true);
    setGeolocationPosition(undefined);
    setGeolocationPositionError(undefined);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setGeolocationPosition({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        }),
      (e) => {
        setIsLoading(false);
        setGeolocationPositionError(e);
      }
    );
  }, []);

  const locationChosenClick = useCallback((location: Location) => {
    setIsLoading(true);
    setGeolocationPosition(location);
    setGeolocationPositionError(undefined);
  }, []);

  const resetClick = useCallback(() => {
    setGeolocationPosition(undefined);
    setGeolocationPositionError(undefined);
    setResultError(undefined);
    setResults(undefined);
    setIsLoading(false);
  }, []);

  /*******************************************************/
  /* CALCULATE RESULTS */

  const calculateResults = useCallback(
    (weatherResponse: WeatherResponse) => {
      async function convertWeatherToResults() {
        console.warn("Weather Data:", weatherResponse);

        const settings = defaultSettings;
        const data = weatherResponse.hourly;
        const totalHours = data.time.length;

        if (totalHours === 0) {
          setResults([]);
          return;
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
            data.precipitation_probability[hour] >
              settings.maxPrecipitationChance ||
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
          setResults([]);
          return;
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
          (currentGroup.dataIndexes.length >= settings.minHours || // Ignore if there aren't enough hours
            currentGroup.dataIndexes[0] !== suitableHours[0])
        ) {
          addSuitableTime(currentGroup);
        }

        /*
          TODO
          Filter our cooler temperatures if there are better ones (i.e. only LOW scores)
          Warn on high UV Index
         */

        setResults(suitableTimes);
        setIsLoading(false);
      }

      void convertWeatherToResults();
    },
    [setResults]
  );

  /*******************************************************/
  /* FETCH WEATHER */

  useEffect(() => {
    if (!geolocationPosition) {
      return;
    }

    async function getWeather() {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geolocationPosition?.latitude}&longitude=${geolocationPosition?.longitude}&hourly=temperature_2m,precipitation_probability,precipitation,cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,uv_index,is_day,weathercode&windspeed_unit=mph&timezone=GMT&forecast_days=14`
        );

        const data: WeatherResponse | WeatherError | undefined =
          await response.json();

        if (!response.ok || (data as WeatherError).error) {
          setIsLoading(false);
          setResultError(
            `Failed to determine weather for your location: ${
              response.statusText
            } ${(data as WeatherError).reason}`
          );
        } else if (!data) {
          setIsLoading(false);
          setResultError(
            `Unexpected error trying to determine weather for your location.`
          );
        } else {
          calculateResults(data as WeatherResponse);
        }
      } catch (error) {
        setIsLoading(false);
        setResultError(
          `Unable to determine weather for your location: ${error}`
        );
      }
    }

    void getWeather();
  }, [calculateResults, geolocationPosition]);

  /*******************************************************/
  /* DISPLAY INPUT */

  const displayInputs = useMemo(() => {
    return (
      <div className="flex h-screen">
        <div className="m-auto p-8 rounded grid grid-cols-1 gap-2 text-center bg-slate-50 w-3/4 md:w-128">
          {resultError && <p>Error: {resultError}</p>}
          {navigator.geolocation && (
            <>
              <div>
                <button
                  className="rounded bg-orange-400 px-6 py-3 text-slate-50"
                  onClick={locationClick}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  )}
                  {!isLoading && (
                    <i className="fa-solid fa-location-crosshairs"></i>
                  )}{" "}
                  Use current location
                </button>
                {geolocationPositionError && (
                  <p>Error: {geolocationPositionError.message}</p>
                )}
              </div>
            </>
          )}
          {navigator.geolocation && <div className="">or</div>}
          <div>
            <LocationTypeahead
              onLocationChosen={locationChosenClick}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    );
  }, [
    geolocationPositionError,
    isLoading,
    locationChosenClick,
    locationClick,
    resultError,
  ]);

  /*******************************************************/
  /* DISPLAY RESULTS */

  const displayResults = useMemo(() => {
    return (
      <div className="flex-1">
        <div className="flex flex-col mx-1 sm:mx-auto sm:w-1/2 gap-4 my-4">
          {results?.map((r, i) => (
            <Result suitableTime={r} key={i} />
          ))}
          {results?.length === 0 && (
            <div className="flex flex-col rounded bg-orange-200 px-3 py-2 gap-2">
              Sorry, but there are no good times to have a BBQ in the next 14
              days for your chosen location.
            </div>
          )}
        </div>
      </div>
    );
  }, [results]);

  /*******************************************************/
  /* RENDER */
  return (
    <div className="h-screen min-w-max min-h-max flex flex-col">
      <div className="bg-orange-300 p-1 antialiased flex items-center gap-1">
        <img
          src="logo64.png"
          alt=""
          className="cursor-pointer opacity-80 my-2"
          onClick={resetClick}
        />
        <h1 className="text-gray-900 font-semibold">When can I have a BBQ?</h1>
      </div>
      {(geolocationPosition && !isLoading && !resultError && displayResults) ||
        displayInputs}
    </div>
  );
}

export default App;
