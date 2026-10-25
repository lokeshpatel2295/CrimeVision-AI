import os

from flask import Blueprint, jsonify

from app.services.vision_service import analyze_image, analyze_image_quality


analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/<filename>", methods=["GET"])
def analyze_evidence(filename):

    image_path = os.path.join("uploads", filename)

    # Existing metadata analysis
    result = analyze_image(image_path)

    # New computer vision quality analysis
    quality_result = analyze_image_quality(image_path)

    if result.get("status") == "success":
        result["analysis"]["quality"] = quality_result.get(
            "quality",
            {}
        )

    return jsonify(result)