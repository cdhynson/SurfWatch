import json
import traceback
from datetime import datetime, timezone, timedelta
import os

import numpy as np
import pandas as pd
import xgboost as xgb
import openmeteo_requests
import requests_cache
from retry_requests import retry
from fastapi import HTTPException

# --- Constants ---

US_HOLIDAYS_2025 = {
    "2025-01-01", "2025-01-20", "2025-02-17", "2025-05-26",
    "2025-07-04", "2025-09-01", "2025-10-13", "2025-11-11",
    "2025-11-27", "2025-12-25"
}

WEATHER_CODE_LOOKUP = {
    0: "sunny", 1: "partial-clouds", 2: "partial-clouds", 3: "cloudy",
    45: "cloudy", 51: "rain", 53: "rain",
    55: "rain", 61: "rain", 63: "rain", 65: "rain", 71: "snow"
}

BEACHES = {
    1: [33.381440, -117.588430],
    2: [32.863000, -117.257000],
    # "laJolla": [32.865777, -117.256140],
    # "delMar": [32.959163, -117.269630],
    # "blacks": [32.883380, -117.255710],
    # "cardiff": [33.013522, -117.282190],
}

# --- Data Classes ---

class CrowdRequest:
    def __init__(self, beach_id, timestamp, is_holiday, weather, sea_temp, wave_height, wind_speed):
        self.beach_id = beach_id
        self.timestamp = timestamp
        self.is_holiday = is_holiday
        self.weather = weather
        self.sea_temp = sea_temp
        self.wave_height = wave_height
        self.wind_speed = wind_speed

# --- API Helpers ---

def get_openmeteo_client():
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    return openmeteo_requests.Client(session=retry_session)

def weather_api(lat, lon, start_hour, end_hour):
    """
    Fetches hourly and daily weather data from Open-Meteo API.

    Args:
        lat (float): Latitude of the location.
        lon (float): Longitude of the location.
        start_hour (str): Start date in ISO format (YYYY-MM-DD).
        end_hour (str): End date in ISO format (YYYY-MM-DD).

    Returns:
        tuple: (daily_dataframe, hourly_dataframe, current_temperature_2m, current_weather_code)

    Raises:
        HTTPException: If the API request fails.
    """
    try:
        client = get_openmeteo_client()
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat, "longitude": lon,
            "daily": ["sunrise", "sunset", "uv_index_max"],
            "hourly": ["temperature_2m", "wind_speed_10m", "wind_direction_10m"],
            "current": ["temperature_2m", "weather_code"],
            "wind_speed_unit": "ms", "temperature_unit": "fahrenheit",
            "precipitation_unit": "inch", "timezone": "auto",
            "start_date": start_hour, "end_date": end_hour
        }

        response = client.weather_api(url, params=params)[0]
        current = response.Current()
        current_temp = current.Variables(0).Value()
        current_code = current.Variables(1).Value()

        hourly = response.Hourly()
        hourly_df = pd.DataFrame({
            "date": pd.date_range(
                start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
                end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
                freq=pd.Timedelta(seconds=hourly.Interval()), inclusive="left"
            ),
            "temperature_2m": hourly.Variables(0).ValuesAsNumpy(),
            "wind_speed_10m": hourly.Variables(1).ValuesAsNumpy(),
            "wind_direction_10m": hourly.Variables(2).ValuesAsNumpy()
        })

        daily = response.Daily()
        daily_df = pd.DataFrame({
            "date": pd.date_range(
                start=pd.to_datetime(daily.Time(), unit="s", utc=True),
                end=pd.to_datetime(daily.TimeEnd(), unit="s", utc=True),
                freq=pd.Timedelta(seconds=daily.Interval()), inclusive="left"
            ),
            "sunrise": daily.Variables(0).ValuesInt64AsNumpy(),
            "sunset": daily.Variables(1).ValuesInt64AsNumpy(),
            "uv_index_max": daily.Variables(2).ValuesAsNumpy()
        })

        return daily_df, hourly_df, current_temp, current_code

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Weather API error: {str(e)}")

def marine_api(lat, lon, start_hour, end_hour):
    """
    Fetches hourly marine conditions from the Open-Meteo Marine API.

    Args:
        lat (float): Latitude of the location.
        lon (float): Longitude of the location.
        start_hour (str): Start date in ISO format (YYYY-MM-DD).
        end_hour (str): End date in ISO format (YYYY-MM-DD).

    Returns:
        pd.DataFrame: Hourly marine forecast with wave height, sea temperature, etc.

    Raises:
        HTTPException: If the API request fails.
    """
    try:
        client = get_openmeteo_client()
        url = "https://marine-api.open-meteo.com/v1/marine"
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": [
                "wave_height", "sea_surface_temperature", "wind_wave_height",
                "sea_level_height_msl", "swell_wave_height", "swell_wave_direction", "swell_wave_period"
            ],
            "timezone": "auto",
            "start_date": start_hour, "end_date": end_hour
        }

        response = client.weather_api(url, params=params)[0]
        hourly = response.Hourly()

        marine_df = pd.DataFrame({
            "date": pd.date_range(
                start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
                end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
                freq=pd.Timedelta(seconds=hourly.Interval()), inclusive="left"
            ),
            "wave_height": hourly.Variables(0).ValuesAsNumpy(),
            "sea_surface_temperature": hourly.Variables(1).ValuesAsNumpy(),
            "wind_wave_height": hourly.Variables(2).ValuesAsNumpy(),
            "sea_level_height_msl": hourly.Variables(3).ValuesAsNumpy(),
            "swell_wave_height": hourly.Variables(4).ValuesAsNumpy(),
            "swell_wave_direction": hourly.Variables(5).ValuesAsNumpy(),
            "swell_wave_period": hourly.Variables(6).ValuesAsNumpy()
        })

        return marine_df

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Marine API error: {str(e)}")

# --- Forecast Logic ---

def crowd_forecast(req: CrowdRequest):
    """
    Predicts crowdedness percentage at a beach using an XGBoost regression model.

    Args:
        req (CrowdRequest): Contains contextual environmental data and timestamp.

    Returns:
        float: Predicted crowdedness percentage (0–100).
    """
    model = xgb.XGBRegressor()
    model.load_model("/code/app/models/crowd_forecast_model.json")

    with open("/code/app/models/features.json") as f:
        features = json.load(f)

    hour, day = req.timestamp.hour, req.timestamp.weekday()
    row = {
        "beach_id": req.beach_id,
        "timestamp": req.timestamp,
        "is_holiday": req.is_holiday,
        "weather": req.weather,
        "sea_temp": req.sea_temp,
        "wave_height": req.wave_height,
        "wind_speed": req.wind_speed,
        "hour": hour,
        "day_of_week": day,
        "hour_sin": np.sin(2 * np.pi * hour / 24),
        "hour_cos": np.cos(2 * np.pi * hour / 24),
        "dow_sin": np.sin(2 * np.pi * day / 7),
        "dow_cos": np.cos(2 * np.pi * day / 7),
        "crowdedness_lag_1": 0,
        "crowdedness_roll_mean_3": 0
    }

    weather_feature = f"weather_{req.weather:.1f}"
    for feat in features:
        if feat.startswith("weather_"):
            row[feat] = 1 if feat == weather_feature else 0
        elif feat not in row:
            row[feat] = 0

    input_df = pd.DataFrame([row])[features]
    prediction = model.predict(input_df)[0]
    if prediction < 0:
        prediction = 0
    return prediction

def avg_conditions(lat, lon, start, end):
    """
    Computes average weather and marine conditions over a given time window.

    Args:
        lat (float): Latitude of the location.
        lon (float): Longitude of the location.
        start (str): Start date in ISO format (YYYY-MM-DD).
        end (str): End date in ISO format (YYYY-MM-DD).

    Returns:
        dict: Dictionary containing averaged environmental variables.
    """
    _, weather_hourly, _, _ = weather_api(lat, lon, start, end)
    marine_hourly = marine_api(lat, lon, start, end)
    hourly = pd.merge(weather_hourly, marine_hourly, on="date", how="inner").drop("date", axis=1)
    return {"averages": {k: float(v) for k, v in hourly.mean(skipna=True).to_dict().items()}}

def generate_hourly_crowd_forecast(beach_id: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Generates an hourly forecast of beach crowdedness for a given beach and date range.

    Args:
        beach_id (str): The ID of the beach (must match keys in the `beaches` dict).
        start_date (str): The start date in format "YYYY-MM-DD".
        end_date (str): The end date in format "YYYY-MM-DD".

    Returns:
        pd.DataFrame: DataFrame containing 'timestamp' and 'crowdedness' columns.
    """
    if beach_id not in BEACHES:
        raise ValueError(f"Unknown beach_id: {beach_id}")

    lat, lon = BEACHES[beach_id]

    # Fetch environmental data
    weather_df, weather_hourly, current_temp, current_code = weather_api(lat, lon, start_date, end_date)
    marine_hourly = marine_api(lat, lon, start_date, end_date)

    # Merge on datetime
    hourly_data = pd.merge(weather_hourly, marine_hourly, on='date', how='inner')
    hourly_data = hourly_data.dropna(subset=["sea_surface_temperature", "wave_height", "wind_speed_10m"])

    forecasts = []

    for _, row in hourly_data.iterrows():
        timestamp = row["date"]
        is_holiday = int(timestamp.strftime("%Y-%m-%d") in US_HOLIDAYS_2025)
        weather = float(current_code)  # Could also estimate from conditions

        req = CrowdRequest(
            beach_id=1,  # If your model was trained on int IDs
            timestamp=timestamp.to_pydatetime(),
            is_holiday=is_holiday,
            weather=weather,
            sea_temp=row["sea_surface_temperature"],
            wave_height=row["wave_height"],
            wind_speed=row["wind_speed_10m"]
        )

        predicted = crowd_forecast(req)
        forecasts.append({"timestamp": timestamp, "crowdedness": predicted})

    return pd.DataFrame(forecasts)

def summarize_daily_crowdedness(df: pd.DataFrame) -> list[dict]:
    """
    Computes daily mean, median, peak crowdedness, time of peak, and time of least crowded (7am–9pm).

    Args:
        df (pd.DataFrame): DataFrame with 'timestamp' and 'crowdedness' columns.

    Returns:
        list of dict: One dict per day with 'date', 'mean', 'median', 'peak', 'peak_time', 'low_time'.
    """
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.date
    df["hour"] = df["timestamp"].dt.hour

    # Filter for daytime hours only for low time (7am–9pm)
    daytime_df = df[(df["hour"] >= 7) & (df["hour"] <= 20)]

    # Aggregate mean and median
    stats = daytime_df.groupby("date")["crowdedness"].agg(mean="mean", median="median").reset_index()

    # Peak time per day
    peak_rows = (
        df.loc[df.groupby("date")["crowdedness"].idxmax()]
        .reset_index(drop=True)
        .loc[:, ["date", "crowdedness", "timestamp"]]
    )
    peak_rows.rename(columns={"crowdedness": "peak", "timestamp": "peak_time"}, inplace=True)

    # Least crowded time during daytime per day
    low_rows = (
        daytime_df.loc[daytime_df.groupby("date")["crowdedness"].idxmin()]
        .reset_index(drop=True)
        .loc[:, ["date", "timestamp"]]
    )
    low_rows.rename(columns={"timestamp": "low_time"}, inplace=True)

    # Merge all summaries
    summary = stats.merge(peak_rows, on="date").merge(low_rows, on="date")

    return [
        {
            "date": row["date"].isoformat(),
            "mean": round(row["mean"], 2),
            "median": round(row["median"], 2),
            "value": round(row["peak"], 0),
            "peak_time": pd.to_datetime(row["peak_time"]).strftime("%-I%p").lower(),
            "low_time": pd.to_datetime(row["low_time"]).strftime("%-I%p").lower()
        }
        for _, row in summary.iterrows()
    ]

def get_environmental_summary(beach_id: int, start: str, end: str) -> dict:
    try:
        lat, lon = BEACHES[beach_id]

        # Parse ISO strings with UTC timezone
        start_dt = pd.to_datetime(start)
        end_dt = pd.to_datetime(end)

        # Ensure timezone is UTC
        if start_dt.tzinfo is None:
            start_dt = start_dt.tz_localize("UTC")
        else:
            start_dt = start_dt.tz_convert("UTC")

        if end_dt.tzinfo is None:
            end_dt = end_dt.tz_localize("UTC")
        else:
            end_dt = end_dt.tz_convert("UTC")

        # Handle case where end <= start
        if end_dt <= start_dt:
            end_dt = start_dt + timedelta(hours=1)

        # Fetch API data for date range (using just the date parts)
        daily_df, hourly_df, current_temp, current_code = weather_api(
            lat, lon, start_dt.date().isoformat(), end_dt.date().isoformat()
        )
        marine_df = marine_api(
            lat, lon, start_dt.date().isoformat(), end_dt.date().isoformat()
        )

        # Filter based on datetime range
        hourly_filtered = hourly_df[
            (hourly_df["date"] >= start_dt) & (hourly_df["date"] <= end_dt)
        ]
        marine_filtered = marine_df[
            (marine_df["date"] >= start_dt) & (marine_df["date"] <= end_dt)
        ]

        # Compute averages
        hourly_avg = hourly_filtered.drop(columns=["date"]).mean(skipna=True)
        marine_avg = marine_filtered.drop(columns=["date"]).mean(skipna=True)

        daily_row = daily_df.iloc[0]

        PST = timezone(timedelta(hours=-7))
        sunrise = datetime.fromtimestamp(daily_row["sunrise"], tz=PST).isoformat()
        sunset = datetime.fromtimestamp(daily_row["sunset"], tz=PST).isoformat()

        return {
            "temperature_2m": round(float(hourly_avg["temperature_2m"]), 0),
            "weather_code": int(current_code),
            "weather_description": WEATHER_CODE_LOOKUP.get(int(current_code), "Unknown"),
            "wind_speed": round(float(hourly_avg["wind_speed_10m"]), 0),
            "wind_direction": int(hourly_avg["wind_direction_10m"]),
            "sea_surface_temperature": round(float(marine_avg["sea_surface_temperature"] * 9 / 5 + 35), 1),
            "wave_height": round(float(
                (marine_avg["wave_height"] + marine_avg["sea_level_height_msl"] + marine_avg["wind_wave_height"]) * 3.28084
            ), 2),
            "tide": round(float(marine_avg["sea_level_height_msl"] * 3.28084), 2),
            "swell_height": round(float(marine_avg["swell_wave_height"] * 3.28084), 2),
            "swell_direction": round(float(marine_avg["swell_wave_direction"] * 3.28084), 2),
            "swell_period": round(float(marine_avg["swell_wave_period"]), 2),
            "sunrise": sunrise,
            "sunset": sunset,
            "uv_max": round(float(daily_row["uv_index_max"]), 1)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Environmental summary error: {str(e)}")

# --- Test Driver ---

if __name__ == "__main__":
    req = CrowdRequest(
        beach_id=1,
        timestamp=datetime(2025, 6, 9, 17, 0),
        is_holiday=0,
        weather=45.0,
        sea_temp=70.3,
        wave_height=2.5,
        wind_speed=5.2
    )

    print(get_environmental_summary(1, "2025-06-09"))
    