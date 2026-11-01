"""
KnotCore Luxury Wedding Planning Management System
Alias file: scene3_service has been renamed to wedding_coordination_service.
All classes and functions are forwarded from wedding_coordination_service.
"""
from knotcore_backend.wedding_coordination_service import (
    WeddingCoordinationService,
    WeddingCoordinationService as Scene3Service,
    init_scene3_tables,
    FULL_SERVICE_28_TASKS,
    DAY_OF_14_TASKS,
    get_db,
    VENDOR_BOT_TOKEN,
    VENDOR_BOT_USERNAME,
    PLANNER_EMAIL,
    EMAIL_ADDRESS,
    EMAIL_PASSWORD
)

__all__ = [
    "WeddingCoordinationService",
    "Scene3Service",
    "init_scene3_tables",
    "FULL_SERVICE_28_TASKS",
    "DAY_OF_14_TASKS",
    "get_db",
    "VENDOR_BOT_TOKEN",
    "VENDOR_BOT_USERNAME",
    "PLANNER_EMAIL",
    "EMAIL_ADDRESS",
    "EMAIL_PASSWORD"
]
