import { useCallback, useEffect, useMemo, useState } from "react";
import { Result } from "./components/Result";
import { LocationTypeahead } from "./components/LocationTypeahead";
import { getWeather } from "./weather/weatherApi";
import {
  SuitableTime,
  defaultSettings,
  interpretWeather,
} from "./weather/interpretWeather";
import { ResultRow } from "./components/ResultRow";
// import { SettingsInput } from "./components/Settings";

export type Location = {
  latitude: number;
  longitude: number;
};

const settings = defaultSettings;

function App() {
  // TODO: Move results to separate URL
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [geoPosition, setGeoPosition] = useState<Location | null>(null);
  const [results, setResults] = useState<SuitableTime[] | null>(null);

  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setGeoPosition(null);
    setError(null);
    setResults(null);
    setIsLoading(false);
  }, []);

  const locationClick = useCallback(() => {
    reset();
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setGeoPosition({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        }),
      (e) => {
        setIsLoading(false);
        setError(`Geolocation failed. ${e.message}`);
      }
    );
  }, [reset]);

  const locationChosenClick = useCallback(
    (location: Location) => {
      reset();
      setIsLoading(true);
      setGeoPosition(location);
    },
    [reset]
  );

  /*******************************************************/
  /* FETCH WEATHER + CALCULATE RESULTS */

  useEffect(() => {
    if (!geoPosition) {
      return;
    }

    async function getWeatherAndProcess(longitude: number, latitude: number) {
      var response = await getWeather(longitude, latitude, settings.daysAhead);
      if (response.isSuccess) {
        var suitableTimes = interpretWeather(response.data, settings);
        setResults(suitableTimes);
      } else {
        setError(response.error);
      }
      setIsLoading(false);
    }

    void getWeatherAndProcess(geoPosition.longitude, geoPosition.latitude);
  }, [geoPosition]);

  /*******************************************************/
  /* DISPLAY INPUT */

  const displayInputs = useMemo(() => {
    return (
      <div className="flex h-screen">
        <div className="m-auto p-8 rounded grid grid-cols-1 gap-2 text-center bg-slate-50 w-3/4 md:w-128">
          {error && (
            <p className="rounded bg-red-700 text-white p-1 mb-2">
              Error: {error}
            </p>
          )}
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
              </div>
            </>
          )}
          {navigator.geolocation && <div>or</div>}
          <div>
            <LocationTypeahead
              onLocationChosen={locationChosenClick}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    );
  }, [isLoading, locationChosenClick, locationClick, error]);

  /*******************************************************/
  /* DISPLAY RESULTS */

  const displayResults = useMemo(() => {
    return (
      <div className="flex-1">
        <div className="flex flex-col mx-1 sm:mx-auto md:w-1/2 gap-4 my-4">
          {/* <ResultRow>
            <SettingsInput settings={settings} onSettingsChanged={(s) => {}} />
          </ResultRow> */}
          {results?.map((r, i) => (
            <ResultRow cols={2}>
              <Result suitableTime={r} settings={settings} key={i} />
            </ResultRow>
          ))}
          {results?.length === 0 && (
            <ResultRow>
              Sorry, but there are no good times to have a BBQ in the next 14
              days for your chosen location.
            </ResultRow>
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
          alt="BBQ Logo"
          className="cursor-pointer opacity-80 my-2"
          onClick={reset}
        />
        <h1 className="text-gray-900 font-semibold">When can I have a BBQ?</h1>
      </div>
      {(results && displayResults) || displayInputs}
    </div>
  );
}

export default App;
