from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState


@tool
def get_project_constraints(
    scenario: Annotated[dict, InjectedState("scenario")],
) -> dict:
    """Get the project's deadline, capacity, committed work, and feature names.

    Use this before making factual claims about the project. Capacity includes
    the committed work; unallocated capacity is what remains after that work.
    """
    facts = scenario["facts"]
    capacity = facts["remaining_team_capacity_points"]
    committed = facts["committed_work"]

    return {
        "deadline": facts["deadline"],
        "available_capacity_points": capacity,
        "committed_work": committed,
        "unallocated_capacity_points": capacity - committed["effort_points"],
        "requested_features": facts["requested_features"],
        "additional_staff_available": facts["additional_staff_available"],
        "scenario_notes": [
            item["fact"] for item in scenario.get("discoverable_information", [])
        ],
    }


@tool
def check_release_plan(
    feature_names: list[str],
    scenario: Annotated[dict, InjectedState("scenario")],
) -> dict:
    """Calculate whether a release plan fits the project's available capacity.

    Use exact feature names from get_project_constraints. Committed work is
    always included, even if omitted from feature_names. An empty list checks
    committed work alone. Repeated feature names are counted only once.
    """
    facts = scenario["facts"]
    committed = facts["committed_work"]
    features = [committed, *facts["requested_features"]]
    by_name = {feature["name"].casefold(): feature for feature in features}
    selected_names = {name.strip().casefold() for name in feature_names}
    unknown_names = selected_names - by_name.keys()

    if unknown_names:
        return {
            "error": "Unknown feature names. Use names from get_project_constraints.",
            "unknown_features": sorted(unknown_names),
            "available_features": [feature["name"] for feature in features],
        }

    selected_names.add(committed["name"].casefold())
    selected_features = [
        feature for feature in features
        if feature["name"].casefold() in selected_names
    ]
    required = sum(feature["effort_points"] for feature in selected_features)
    available = facts["remaining_team_capacity_points"]

    return {
        "deadline": facts["deadline"],
        "included_features": selected_features,
        "required_capacity_points": required,
        "available_capacity_points": available,
        "fits_capacity": required <= available,
        "over_capacity_points": max(0, required - available),
    }


project_tools = [get_project_constraints, check_release_plan]
