import { useCallback, useEffect, useMemo, useState } from "react";
import { Result } from "./components/Result";
import { LocationTypeahead } from "./components/LocationTypeahead";
import { WeatherResponse, getWeather } from "./weather/weatherApi";
import {
  SuitableTime,
  defaultSettings,
  interpretWeather,
} from "./weather/interpretWeather";

export type Location = {
  latitude: number;
  longitude: number;
};

function App() {
  // TODO: Clean up various states used to decide what to display, e.g. loading states.
  // TODO: Move results to separate URL
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
  /* FETCH WEATHER + CALCULATE RESULTS */

  useEffect(() => {
    if (!geolocationPosition) {
      return;
    }

    async function getWeatherAndProcess(longitude: number, latitude: number) {
      var response = await getWeather(longitude, latitude);
      if (response.isSuccess) {
        var suitableTimes = interpretWeather(response.data, defaultSettings);
        setResults(suitableTimes);
      } else {
        setResultError(response.error);
      }
      setIsLoading(false);
    }

    void getWeatherAndProcess(
      geolocationPosition.longitude,
      geolocationPosition.latitude
    );
  }, [geolocationPosition]);

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
        <div className="flex flex-col mx-1 sm:mx-auto md:w-1/2 gap-4 my-4">
          {results?.map((r, i) => (
            <Result suitableTime={r} settings={defaultSettings} key={i} />
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
