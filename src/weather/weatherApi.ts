// https://open-meteo.com/en/docs?#latitude=51.1438656&longitude=-0.9911955&hourly=temperature_2m,precipitation_probability,precipitation,cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,uv_index,is_day,weathercode&windspeed_unit=mph&forecast_days=14

export type WeatherResponse = {
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
  };
};

type WeatherError = {
  error: boolean;
  reason: string;
};

export type WeatherData =
  | {
      isSuccess: true;
      data: WeatherResponse;
    }
  | {
      isSuccess: false;
      error: string;
    };

export async function getWeather(
  longitude: number,
  latitude: number,
  forecastDays: number
): Promise<WeatherData> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability,precipitation,cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,uv_index,is_day,weathercode&windspeed_unit=mph&timezone=GMT&forecast_days=${forecastDays}`
    );

    const data: WeatherResponse | WeatherError | undefined =
      await response.json();

    if (!response.ok || (data as WeatherError).error) {
      return {
        isSuccess: false,
        error: `Failed to determine weather for your location: ${
          response.statusText
        } ${(data as WeatherError).reason}`,
      };
    } else if (!data) {
      return {
        isSuccess: false,
        error: `Unexpected error trying to determine weather for your location.`,
      };
    } else {
      return { isSuccess: true, data: data as WeatherResponse };
    }
  } catch (error) {
    return {
      isSuccess: false,
      error: `Unable to determine weather for your location: ${error}`,
    };
  }
}
