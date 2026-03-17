# Methodology

This repository uses a lightweight analysis pipeline built on top of FastF1 to turn race session data into readable performance views.

## How Data Is Pulled

The workflow in [main.py](/C:/dev/f1-race-insights/main.py) uses `fastf1.get_session(year, race, "R")` to load a Formula 1 race session and then calls `session.load()` to retrieve the underlying timing and lap data.

Caching is enabled through FastF1's local cache system:

- Session responses are stored under `cache/`
- Repeated runs reuse downloaded data instead of fetching the same session again
- The script currently targets the 2024 Monaco Grand Prix race session by default

After the session is loaded, the analysis narrows to `session.laps.pick_quicklaps()`. This intentionally filters the dataset toward representative laps and reduces the influence of very slow laps caused by incidents, pit phases, or other disrupted conditions.

## What Metrics Are Calculated

The current analysis calculates four core views from the filtered lap dataset:

### 1. Average Race Pace

For each driver, the script computes the mean lap time across quick laps and ranks the field from fastest average pace to slowest.

This is used to answer:

- Who sustained the strongest underlying race pace?
- Which drivers were competitive on average, not just on one standout lap?

### 2. Lap Time Trends

The five fastest drivers by average pace are selected for a lap-by-lap trend view.

For each of those drivers, the script plots:

- `LapNumber`
- Lap time in seconds

This makes it easier to see rhythm, stability, and whether pace changed over the course of the race.

### 3. Driver Consistency

For each driver, lap-time standard deviation is calculated across quick laps.

Lower standard deviation suggests a more stable performance profile, while higher values suggest greater variability from lap to lap.

### 4. Pace Degradation

For the top five average-pace drivers, the script compares:

- the mean of the first 5 quick laps
- the mean of the last 5 quick laps

The difference is labeled as degradation:

`Degradation = End Average - Start Average`

A positive number indicates that the driver was slower at the end of the sampled run than at the start.

## How Charts Are Generated

Charts are generated directly in Python using:

- `matplotlib` for figure creation and saving
- `seaborn` for bar-chart styling
- `pandas` for grouping and metric calculation

The current outputs are written to `charts/`:

- `charts/monaco_2024_driver_pace.png`
- `charts/monaco_2024_lap_trends.png`
- `charts/monaco_2024_consistency.png`
- `charts/monaco_2024_degradation.png`

These correspond to:

- average pace ranking
- top-driver lap progression
- lap-time variability
- start-versus-end pace change

## Assumptions And Limitations

This project is intentionally compact, which means the analysis is useful but not exhaustive.

Key assumptions:

- Quick laps are treated as a cleaner proxy for race pace than all laps combined
- Average lap time is used as a practical summary metric for competitive pace
- The first and last five quick laps are used as a simple approximation of degradation

Current limitations:

- Safety cars, virtual safety cars, traffic, and pit strategy are not explicitly segmented
- Monaco 2024 is hard-coded in the current entry point
- Tire compounds, stint boundaries, and weather effects are not broken out separately
- The degradation view is a heuristic, not a full tire model
- Results depend on FastF1's available session data and filtering behavior

In short: this repository is best understood as a compact motorsport analytics study, not a full race simulation or strategy engine.
