from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename

from app.services.vision_service import enhance_image


evidence_bp = Blueprint("evidence", __name__)


UPLOAD_FOLDER = "uploads"


# --------------------------------------------------
# Upload Evidence
# --------------------------------------------------

@evidence_bp.route("/upload", methods=["POST"])
def upload_evidence():

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    filename = secure_filename(file.filename)

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    file.save(file_path)

    return jsonify({
        "message": "Evidence uploaded successfully",
        "filename": filename,
        "path": file_path
    }), 200


# --------------------------------------------------
# Enhance Evidence
# --------------------------------------------------

@evidence_bp.route("/enhance/<filename>", methods=["POST"])
def enhance_evidence(filename):

    filename = secure_filename(filename)

    image_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if not os.path.exists(image_path):
        return jsonify({
            "status": "error",
            "message": "Evidence file not found"
        }), 404

    result = enhance_image(image_path)

    if result.get("status") == "error":
        return jsonify(result), 500

    return jsonify(result), 200