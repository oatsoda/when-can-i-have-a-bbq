import { useMemo, useRef } from "react";
import { formatDate, formatTimes } from "../core/dateFunctions";
import { Settings, SuitableTime } from "../weather/interpretWeather";

export function Result({
  suitableTime,
  settings,
}: {
  suitableTime: SuitableTime;
  settings: Settings;
}) {
  const tempIndicatorCss = useMemo(() => {
    if (suitableTime.avg_temperature_2m >= 20)
      return "fa-solid fa-temperature-full text-red-600";
    if (suitableTime.avg_temperature_2m >= 18)
      return "fa-solid fa-temperature-three-quarters text-orange-600";
    return "fa-solid fa-temperature-empty text-amber-400";
  }, [suitableTime.avg_temperature_2m]);

  const tempIndicatorDescription = useMemo(() => {
    const prefix = "Temperature:";
    if (suitableTime.avg_temperature_2m >= 20)
      return `${prefix} Averages over 20 degress celsius.`;
    if (suitableTime.avg_temperature_2m >= 18)
      return `${prefix} Averages between 18 and 20 degress celsius.`;
    return `${prefix} Averages between ${settings.minTemperature} and 18 degress celsius.`;
  }, [settings.minTemperature, suitableTime.avg_temperature_2m]);

  const weatherIndicatorCss = useMemo(() => {
    if (suitableTime.avg_weathercode === 0) return "fa-solid fa-sun";
    if (suitableTime.avg_weathercode < 1.5) return "fa-regular fa-sun";
    if (suitableTime.avg_weathercode < 2.5) return "fa-solid fa-cloud-sun";
    return "fa-solid fa-cloud";
  }, [suitableTime.avg_weathercode]);

  const weatherIndicatorDescription = useMemo(() => {
    const prefix = "Predominant weather: ";
    if (suitableTime.avg_weathercode === 0) return `${prefix} Clear skies`;
    if (suitableTime.avg_weathercode < 0.5) return `${prefix} Mostly clear`;
    if (suitableTime.avg_weathercode < 1.5) return `${prefix} Partly Cloudy`;
    if (suitableTime.avg_weathercode < 2.5) return `${prefix} Cloudy`;
    return `${prefix} Overcast`;
  }, [suitableTime.avg_weathercode]);

  const now = useRef(new Date());

  return (
    <div className="grid grid-flow-col grid-cols-2">
      <div className="row-span-2">
        <h2 className="align-top">
          {suitableTime.perfect && <i className="fa-solid fa-star mr-2"></i>}
          {formatDate(suitableTime.timeFrom, now.current)}{" "}
        </h2>
        <h3>
          {formatTimes(suitableTime.timeFrom, suitableTime.timeTo)}{" "}
          <small className="hidden sm:inline text-xs text-slate-600">
            ({suitableTime.hours} hours)
          </small>
        </h3>
      </div>

      <div className="text-lg">
        <i className={tempIndicatorCss} title={tempIndicatorDescription}></i>{" "}
        {Math.round(suitableTime.avg_temperature_2m)}℃{" "}
        <i
          className={weatherIndicatorCss}
          title={weatherIndicatorDescription}
        ></i>
      </div>

      <div className="flex flex-row gap-2 text-slate-600">
        <div>
          <i
            className="fa-solid fa-umbrella"
            title="Percentage chance of precipitation"
          ></i>{" "}
          {Math.round(suitableTime.avg_precipitation_probability)}%
        </div>
        <div>
          <i
            className="fa-solid fa-cloud-sun"
            title="Percentage cloudcover"
          ></i>{" "}
          {Math.round(suitableTime.avg_cloudcover)}%
        </div>
        <div>UV: {suitableTime.max_uv_index}</div>
      </div>
    </div>
  );
}
