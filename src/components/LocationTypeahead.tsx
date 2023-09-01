import { useCallback, ChangeEvent, useState, useEffect, useRef } from "react";
import { Location } from "../App";

// https://geocode.maps.co/search?q=alton
// https://www.geonames.org/

type ApiLocation = {
  place_id: number;
  class: string;
  display_name: string;
  lat: number;
  lon: number;
};

export function LocationTypeahead({
  onLocationChosen,
  disabled,
}: {
  onLocationChosen: (location: Location) => void;
  disabled: boolean;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ApiLocation | null>(
    null
  );
  const [matchingLocations, setMatchingLocations] = useState<ApiLocation[]>([]);

  const debounceTimeout = useRef<number | null>(null);

  const onLocationInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedLocation(null);
    setSearchText(e.target.value);
  }, []);

  useEffect(() => {
    if (!searchText || searchText.length < 3) {
      setMatchingLocations([]);
      return;
    }

    async function FindLocations() {
      try {
        const response = await fetch(
          `https://geocode.maps.co/search?q=${searchText}`
        );

        const data: ApiLocation[] | undefined = await response.json();

        if (!response.ok) {
          console.error(`Failed to search locations: ${response.statusText}`);
        } else if (!data) {
          console.error(
            `Unexpected error trying to determine weather for your location.`
          );
        } else {
          setMatchingLocations(data);
        }
      } catch (error) {
        console.error(`Unable to search locations: ${error}`);
      }
    }

    if (debounceTimeout.current) {
      window.clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = window.setTimeout(FindLocations, 600);
  }, [searchText]);

  const onLocationSelected = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const location = matchingLocations.filter(
        (l) => l.place_id === Number.parseInt(e.target.value)
      )[0];
      setSelectedLocation(location);
      setSearchText(null);
      setMatchingLocations([]);
    },
    [matchingLocations]
  );

  const onButtonClick = useCallback(() => {
    if (!selectedLocation) {
      console.error("Button clicked, but no selected location");
      return;
    }
    setIsLoading(true);
    const location = selectedLocation;
    setSelectedLocation(location);
    setSearchText(null);
    setMatchingLocations([]);
    const loc: Location = {
      latitude: location.lat,
      longitude: location.lon,
    };
    onLocationChosen(loc);
  }, [onLocationChosen, selectedLocation]);

  return (
    <>
      <div className="flex flex-row">
        <div className="flex-1">
          <input
            type="text"
            className="rounded border-2 px-3 py-2 w-full"
            placeholder={selectedLocation?.display_name ?? "Enter location"}
            value={searchText ?? ""}
            onChange={onLocationInput}
            disabled={disabled || isLoading}
          />
        </div>
        <div className="flex-none">
          <button
            disabled={!selectedLocation || disabled || isLoading}
            className="rounded bg-orange-400 px-6 py-2 ml-2 text-slate-50 border-2 border-orange-400 disabled:opacity-50"
            onClick={onButtonClick}
          >
            {isLoading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
            {!isLoading && <i className="fa-solid fa-location-arrow"></i>} Go
          </button>
        </div>
      </div>
      <div className="relative w-full text-left">
        {matchingLocations.length > 1 && (
          <select
            className="absolute flex-1 rounded border-0 px-3 py-2 w-full"
            size={8}
            onChange={onLocationSelected}
          >
            {matchingLocations.map((l) => (
              <option value={l.place_id}>{l.display_name}</option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
