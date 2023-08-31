import { days } from "../core/dateFunctions";
import { Settings } from "../weather/interpretWeather";

export function SettingsInput({
  settings,
  onSettingsChanged,
}: {
  settings: Settings;
  onSettingsChanged: (settings: Settings) => void;
}) {
  return (
    <div className="col-span-2">
      <div>
        <h3>Settings</h3>
      </div>
      <div>Days: </div>
      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
        <div>{days[d]}</div>
      ))}
    </div>
  );
}
