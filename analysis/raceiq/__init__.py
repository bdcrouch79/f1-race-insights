"""RaceIQ historical race analysis engine.

This package turns a FastF1 race session into the versioned, structured
RaceIQ analysis contract consumed by the RaceIQ frontend. It is a
refactor of the original single-script analysis in ``main.py`` into
callable, testable functions. The underlying calculations are
unchanged: it computes average race pace, lap-time trends, driver
consistency, and an opening-versus-closing pace degradation heuristic
from FastF1 "quick lap" data.
"""

from raceiq.engine import run_analysis
from raceiq.schemas import ANALYSIS_VERSION

__all__ = ["run_analysis", "ANALYSIS_VERSION"]
