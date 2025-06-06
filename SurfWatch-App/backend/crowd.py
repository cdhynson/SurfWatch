import pandas as pd
import traceback
from fastapi import (
    FastAPI, Request, Query, Form, Body, Depends, Security,
    status, HTTPException
)

import numpy as np
import json
import xgboost as xgb
from pydantic import BaseModel
from datetime import datetime
import openmeteo_requests
import pandas as pd
import requests_cache
from retry_requests import retry

# Define holidays to match against
us_holidays_2025 = {
    "2025-01-01", "2025-01-20", "2025-02-17", "2025-05-26",
    "2025-07-04", "2025-09-01", "2025-10-13", "2025-11-11",
    "2025-11-27", "2025-12-25"
}

class CrowdRequest:
    beach_id: int
    timestamp: datetime
    is_holiday: int
    weather: int
    sea_temp: int
    wave_height:int
    wind_speed: int
    
class WeatherRequest:
    lat: float
    lon: float
    start_hour: datetime
    end_hour: datetime
    
def weather_api(req: WeatherRequest):
    try:
            
        # Setup the Open-Meteo API client with cache and retry on error
        cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
        retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
        openmeteo = openmeteo_requests.Client(session = retry_session)

        # Make sure all required weather variables are listed here
        # The order of variables in hourly or daily is important to assign them correctly below
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": req.lat,
            "longitude": req.lon,
            "hourly": ["temperature_2m", "wind_speed_10m", "weather_code", "wind_direction_10m"],
            "current": ["wind_speed_10m", "temperature_2m", "wind_direction_10m"],
            "wind_speed_unit": "ms",
            "temperature_unit": "fahrenheit",
            "precipitation_unit": "inch",
            "start_date": req.start_hour,
            "end_date": req.end_hour
        }
        responses = openmeteo.weather_api(url, params=params)

        # Process first location. Add a for-loop for multiple locations or weather models
        response = responses[0]
        print(f"Coordinates {response.Latitude()}°N {response.Longitude()}°E")
        print(f"Elevation {response.Elevation()} m asl")
        print(f"Timezone {response.Timezone()}{response.TimezoneAbbreviation()}")
        print(f"Timezone difference to GMT+0 {response.UtcOffsetSeconds()} s")

        # Current values. The order of variables needs to be the same as requested.
        current = response.Current()
        current_wind_speed_10m = current.Variables(0).Value()
        current_temperature_2m = current.Variables(1).Value()
        current_wind_direction_10m = current.Variables(2).Value()

        print(f"Current time {current.Time()}")
        print(f"Current wind_speed_10m {current_wind_speed_10m}")
        print(f"Current temperature_2m {current_temperature_2m}")
        print(f"Current wind_direction_10m {current_wind_direction_10m}")

        # Process hourly data. The order of variables needs to be the same as requested.
        hourly = response.Hourly()
        hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()
        hourly_wind_speed_10m = hourly.Variables(1).ValuesAsNumpy()
        hourly_weather_code = hourly.Variables(2).ValuesAsNumpy()
        hourly_wind_direction_10m = hourly.Variables(3).ValuesAsNumpy()

        hourly_data = {"date": pd.date_range(
            start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
            end = pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
            freq = pd.Timedelta(seconds = hourly.Interval()),
            inclusive = "left"
        )}

        hourly_data["temperature_2m"] = hourly_temperature_2m
        hourly_data["wind_speed_10m"] = hourly_wind_speed_10m
        hourly_data["weather_code"] = hourly_weather_code
        hourly_data["wind_direction_10m"] = hourly_wind_direction_10m

        hourly_dataframe = pd.DataFrame(data = hourly_data)
        print(hourly_dataframe)
        return
    except Exception as e:
        print("Weather API Error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Weather API error: {str(e)}")
    
def marine_api(req: WeatherRequest):
    try:
        cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
        openmeteo = openmeteo_requests.Client(session=cache_session)

        url = "https://marine-api.open-meteo.com/v1/marine"
        params = {
            "latitude": req.lat,
            "longitude": req.lon,
            "hourly": ["wave_height", "wind_wave_height", "sea_surface_temperature"],
            "start_hour": req.start_hour,
            "end_hour": req.end_hour
        }
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]  # one location = one response

        hourly = response.Hourly()

        # Extract numpy arrays for each variable
        hourly_wave_height = hourly.Variables(0).ValuesAsNumpy()
        hourly_wind_wave_height = hourly.Variables(1).ValuesAsNumpy()
        hourly_sea_surface_temperature = hourly.Variables(2).ValuesAsNumpy()

        # Build a dictionary with just the arrays
        hourly_data = {
            "wave_height": hourly_wave_height,
            "wind_wave_height": hourly_wind_wave_height,
            "sea_surface_temperature": hourly_sea_surface_temperature
        }

        # Create DataFrame for easy averaging
        hourly_df = pd.DataFrame(data=hourly_data)

        # Compute column-wise means
        averages = hourly_df.mean(skipna=True).to_dict()

        # Convert numpy types to native Python floats (for JSON serialization)
        result = {key: float(val) for key, val in averages.items()}

        return {"averages": result}

    except Exception as e:
        print("Weather API Error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Weather API error: {str(e)}")
   
 
class CrowdRequest:
    def __init__(self, beach_id, timestamp, is_holiday, weather, sea_temp, wave_height, wind_speed):
        self.beach_id = beach_id
        self.timestamp = timestamp
        self.is_holiday = is_holiday
        self.weather = weather
        self.sea_temp = sea_temp
        self.wave_height = wave_height
        self.wind_speed = wind_speed

def crowd_forecast(req: CrowdRequest):
    model_path = "../../Crowd Forecast/models/final/crowd_forecast_model.json"
    features_path = "../../Crowd Forecast/models/final/features.json"

    # Load the model
    model = xgb.XGBRegressor()
    model.load_model(model_path)

    # Load expected feature list
    with open(features_path) as f:
        features = json.load(f)

    # Extract time features
    hour = req.timestamp.hour
    day_of_week = req.timestamp.weekday()

    # Cyclical encoding
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    dow_sin = np.sin(2 * np.pi * day_of_week / 7)
    dow_cos = np.cos(2 * np.pi * day_of_week / 7)

    # Base row
    row = {
        "beach_id": req.beach_id,
        "timestamp": req.timestamp,
        "is_holiday": req.is_holiday,
        "weather": req.weather,
        "sea_temp": req.sea_temp,
        "wave_height": req.wave_height,
        "wind_speed": req.wind_speed,
        "hour": hour,
        "day_of_week": day_of_week,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "dow_sin": dow_sin,
        "dow_cos": dow_cos,
        # These would be missing since we don't have past data for a single request
        "crowdedness_lag_1": 0,
        "crowdedness_roll_mean_3": 0,
    }

    # One-hot encode weather
    weather_dummy_col = f"weather_{req.weather:.1f}"
    for feature in features:
        if feature.startswith("weather_"):
            row[feature] = 1 if feature == weather_dummy_col else 0

    # Ensure all expected features are present
    for col in features:
        if col not in row:
            row[col] = 0

    # Create DataFrame for prediction
    input_df = pd.DataFrame([row])[features]

    # Predict
    prediction = model.predict(input_df)[0]
    return prediction


req = CrowdRequest(
    beach_id=1,
    timestamp=datetime(2025, 5, 30, 8, 0),
    is_holiday=0,
    weather=45.0,
    sea_temp=70.3,
    wave_height=2.5,
    wind_speed=5.2
)

predicted_crowdedness = crowd_forecast(req)
print(f"Predicted crowdedness: {predicted_crowdedness:.2f}%")