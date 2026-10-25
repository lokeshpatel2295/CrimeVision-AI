from flask import Flask
from flask_cors import CORS

from app.routes.health import health_bp
from app.routes.evidence import evidence_bp
from app.routes.analysis import analysis_bp


app = Flask(__name__)

CORS(app)

app.register_blueprint(health_bp)

app.register_blueprint(
    evidence_bp,
    url_prefix="/api/evidence"
)

app.register_blueprint(
    analysis_bp,
    url_prefix="/api/analysis"
)


@app.route("/")
def home():
    return {
        "message": "CrimeVision AI Backend Running"
    }


if __name__ == "__main__":
    app.run(debug=True)