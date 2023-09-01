import { ChangeEvent, useCallback } from "react";
import { days } from "../core/dateFunctions";
import { Settings } from "../weather/interpretWeather";

export function SettingsInput({
  settings,
  onSettingsChanged,
}: {
  settings: Settings;
  onSettingsChanged: (settings: Settings) => void;
}) {
  const updateSettings = useCallback(
    (existingSettings: Settings, mutateSettings: (s: Settings) => void) => {
      const cloned = { ...existingSettings };
      mutateSettings(cloned);
      onSettingsChanged(cloned);
    },
    [onSettingsChanged]
  );

  const daysOfWeekChanged = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const day = parseInt(e.target.value);
      const checked = e.target.checked;

      const index = settings.daysOfTheWeek.indexOf(day);
      if (checked && index < 0) {
        updateSettings(settings, (s) => s.daysOfTheWeek.push(day));
      } else if (!checked && index >= 0) {
        updateSettings(settings, (s) => s.daysOfTheWeek.splice(index, 1));
      }
    },
    [settings, updateSettings]
  );

  const minHoursChanged = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const hours = parseInt(e.target.value);
      if (hours === settings.minHours) {
        return;
      }
      updateSettings(settings, (s) => (s.minHours = hours));
    },
    [settings, updateSettings]
  );

  return (
    <>
      <h3>Settings</h3>
      <div className="mt-2">
        Continuous hours required
        <input
          className="ml-2 rounded border-2"
          type="number"
          min={1}
          max={24}
          value={settings.minHours}
          onChange={minHoursChanged}
        />
      </div>
      <div className="grid grid-flow-cols mt-2">
        <div className="col-span-7 pb-1">Include days</div>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <div key={d}>
            <input
              type="checkbox"
              value={d}
              checked={settings.daysOfTheWeek.includes(d)}
              onChange={daysOfWeekChanged}
            />{" "}
            {days[d]}
          </div>
        ))}
      </div>
    </>
  );
}
