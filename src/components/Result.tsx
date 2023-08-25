import { useCallback } from "react";
import { SuitableTime } from "../App";

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

  return (
    <div className="rounded bg-slate-50 px-3 py-2">
      <h2>
        {suitableTime.perfect && <i className="fa-solid fa-star mr-2"></i>}
        {suitableTime.timeFrom.toDateString()}{" "}
        <small className="text-sm">
          {suitableTime.timeFrom.getHours()}:00 to{" "}
          {suitableTime.timeTo.getHours()}:00 ({suitableTime.hours} hours)
        </small>
      </h2>
      <p>
        <i className={tempIndicator()}></i>{" "}
        {Math.round(suitableTime.avg_temperature_2m)}℃
      </p>
      <p>
        Weather: <i className={weatherIndicator()}></i>
      </p>
      <p>Avg % Precip: {suitableTime.avg_precipitation_probability}</p>
      <p>Avg fraction cloudcover: {suitableTime.avg_cloudcover}</p>
      <p>Max UV: {suitableTime.max_uv_index}</p>
    </div>
  );
}
