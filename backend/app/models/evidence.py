from dataclasses import dataclass, field
from typing import List


@dataclass
class DetectedObject:
    label: str
    confidence: float


@dataclass
class ImageEvidence:
    filename: str
    objects: List[DetectedObject] = field(default_factory=list)