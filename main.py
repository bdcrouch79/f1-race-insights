import fastf1
import pandas as pd
import matplotlib.pyplot as plt

def race_insights(year, race):

    session = fastf1.get_session(year, race, 'R')
    session.load()

    laps = session.laps
    fastest = laps.pick_fastest()

    print("Fastest Lap:")
    print(fastest)

    pace = laps.groupby('Driver')['LapTime'].mean()

    print("")
    print("Average Pace by Driver:")
    print(pace.sort_values())

if __name__ == "__main__":

    race_insights(2024, "Monaco")
