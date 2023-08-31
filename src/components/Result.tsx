import { useCallback, useRef } from "react";
import { SuitableTime } from "../App";
import { formatDate, formatTimes } from "../dateFunctions";

export function Result({ suitableTime }: { suitableTime: SuitableTime }) {
  const tempIndicator = useCallback(() => {
    if (suitableTime.avg_temperature_2m >= 20)
      return "fa-solid fa-temperature-full text-red-600";
    if (suitableTime.avg_temperature_2m >= 18)
      return "fa-solid fa-temperature-three-quarters text-orange-600";
    return "fa-solid fa-temperature-empty text-amber-400";
  }, [suitableTime.avg_temperature_2m]);

  const weatherIndicator = useCallback(() => {
    if (suitableTime.avg_weathercode === 0) return "fa-solid fa-sun";
    if (suitableTime.avg_weathercode < 1.5) return "fa-regular fa-sun";
    if (suitableTime.avg_weathercode < 2.5) return "fa-solid fa-cloud-sun";
    return "fa-solid fa-cloud";
  }, [suitableTime.avg_weathercode]);

  const now = useRef(new Date());

  return (
    <div className="flex flex-col rounded bg-orange-200 bg-opacity-80 px-3 py-2 gap-2">
      <div>
        <h2>
          {suitableTime.perfect && <i className="fa-solid fa-star mr-2"></i>}
          {formatDate(suitableTime.timeFrom, now.current)}{" "}
        </h2>
        <h3>
          {formatTimes(suitableTime.timeFrom, suitableTime.timeTo)}{" "}
          <small className="text-xs text-slate-600">
            ({suitableTime.hours} hours)
          </small>
        </h3>
      </div>
      <div className="pt-1">
        <i className={tempIndicator()} title="Temperature"></i>{" "}
        {Math.round(suitableTime.avg_temperature_2m)}℃{" "}
        <i className={weatherIndicator()} title="Predominant weather"></i>
      </div>
      <div className="flex flex-row mt-1 gap-2 text-sm text-slate-600">
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
