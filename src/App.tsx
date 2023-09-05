import { useCallback, useEffect, useMemo, useState } from "react";
import { Result } from "./components/Result";
import { LocationTypeahead } from "./components/LocationTypeahead";
import { WeatherResponse, getWeather } from "./weather/weatherApi";
import {
  Settings,
  SuitableTime,
  defaultSettings,
  interpretWeather,
} from "./weather/interpretWeather";
import { ResultRow } from "./components/ResultRow";
import { SettingsInput } from "./components/Settings";

export type Location = {
  latitude: number;
  longitude: number;
};

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [geoPosition, setGeoPosition] = useState<Location | null>(null);
  const [weatherResponse, setWeatherResponse] =
    useState<WeatherResponse | null>(null);
  const [results, setResults] = useState<SuitableTime[] | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const reset = useCallback(() => {
    setGeoPosition(null);
    setWeatherResponse(null);
    setResults(null);
    setError(null);
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
  /* FETCH WEATHER */

  useEffect(() => {
    if (!geoPosition) {
      return;
    }

    async function getWeatherResponse(longitude: number, latitude: number) {
      var response = await getWeather(longitude, latitude, 14);
      if (response.isSuccess) {
        setWeatherResponse(response.data);
      } else {
        setError(response.error);
      }
    }

    void getWeatherResponse(geoPosition.longitude, geoPosition.latitude);
  }, [geoPosition]);

  /*******************************************************/
  /* CALCULATE RESULTS */

  useEffect(() => {
    if (!weatherResponse) {
      return;
    }

    var suitableTimes = interpretWeather(weatherResponse, settings);
    setResults(suitableTimes);

    setIsLoading(false);
  }, [weatherResponse, settings]);

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
              <div>or</div>
            </>
          )}
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
          <ResultRow>
            <SettingsInput
              settings={settings}
              onSettingsChanged={setSettings}
            />
          </ResultRow>
          {results?.map((r, i) => (
            <ResultRow key={i}>
              <Result suitableTime={r} settings={settings} />
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
  }, [results, settings]);

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
