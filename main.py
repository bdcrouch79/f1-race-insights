import fastf1
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

os.makedirs("cache", exist_ok=True)
os.makedirs("charts", exist_ok=True)

fastf1.Cache.enable_cache("cache")


def race_insights(year, race):

    print(f"\nLoading {race} {year} race data...\n")

    session = fastf1.get_session(year, race, 'R')
    session.load()

    laps = session.laps.pick_quicklaps()

    ################################################
    # Driver Pace Comparison
    ################################################

    pace = laps.groupby("Driver")["LapTime"].mean().sort_values()
    pace_seconds = pace.dt.total_seconds()

    plt.figure(figsize=(10,6))
    sns.barplot(x=pace_seconds.values, y=pace_seconds.index)

    plt.title(f"{race} {year} Average Race Pace")
    plt.xlabel("Average Lap Time (seconds)")
    plt.ylabel("Driver")

    chart1 = f"charts/{race.lower()}_{year}_driver_pace.png"
    plt.tight_layout()
    plt.savefig(chart1)

    print(f"Driver pace chart saved: {chart1}")

    ################################################
    # Lap Time Trends
    ################################################

    top_drivers = pace.head(5).index

    plt.figure(figsize=(12,6))

    for driver in top_drivers:

        driver_laps = laps.pick_driver(driver)
        lap_times = driver_laps["LapTime"].dt.total_seconds()

        plt.plot(driver_laps["LapNumber"], lap_times, label=driver)

    plt.title(f"{race} {year} Lap Time Trends (Top Drivers)")
    plt.xlabel("Lap")
    plt.ylabel("Lap Time (seconds)")
    plt.legend()

    chart2 = f"charts/{race.lower()}_{year}_lap_trends.png"
    plt.tight_layout()
    plt.savefig(chart2)

    print(f"Lap trend chart saved: {chart2}")

    ################################################
    # Driver Consistency
    ################################################

    consistency = laps.groupby("Driver")["LapTime"].std().sort_values()
    consistency_seconds = consistency.dt.total_seconds()

    plt.figure(figsize=(10,6))
    sns.barplot(x=consistency_seconds.values, y=consistency_seconds.index)

    plt.title(f"{race} {year} Driver Consistency")
    plt.xlabel("Lap Time Standard Deviation (seconds)")
    plt.ylabel("Driver")

    chart3 = f"charts/{race.lower()}_{year}_consistency.png"
    plt.tight_layout()
    plt.savefig(chart3)

    print(f"Consistency chart saved: {chart3}")

    ################################################
    # Pace Degradation
    ################################################

    degradation_data = []

    for driver in top_drivers:

        driver_laps = laps.pick_driver(driver)
        lap_times = driver_laps["LapTime"].dt.total_seconds()

        degradation_data.append({
            "Driver": driver,
            "Start": lap_times.head(5).mean(),
            "End": lap_times.tail(5).mean()
        })

    degradation = pd.DataFrame(degradation_data)

    degradation["Degradation"] = degradation["End"] - degradation["Start"]

    plt.figure(figsize=(8,5))
    sns.barplot(x="Degradation", y="Driver", data=degradation)

    plt.title(f"{race} {year} Pace Degradation")
    plt.xlabel("Lap Time Increase (seconds)")
    plt.ylabel("Driver")

    chart4 = f"charts/{race.lower()}_{year}_degradation.png"
    plt.tight_layout()
    plt.savefig(chart4)

    print(f"Pace degradation chart saved: {chart4}")

    ################################################
    # Console Summary
    ################################################

    print("\nTop 5 Average Pace Drivers:")

    print(pace.head())

    print("\nMost Consistent Drivers:")

    print(consistency.head())



if __name__ == "__main__":

    race_insights(2024, "Monaco")