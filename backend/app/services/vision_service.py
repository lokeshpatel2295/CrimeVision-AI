from PIL import Image, ExifTags
import os
import cv2
import numpy as np


# ============================================================
# BASIC IMAGE + EXIF ANALYSIS
# ============================================================

def analyze_image(image_path):
    """
    Analyze an uploaded evidence image and extract
    technical information and available EXIF metadata.
    """

    if not os.path.exists(image_path):
        return {
            "status": "error",
            "message": "Image file not found"
        }

    try:
        # ----------------------------------------------------
        # Open image
        # ----------------------------------------------------

        image = Image.open(image_path)

        # ----------------------------------------------------
        # Basic image information
        # ----------------------------------------------------

        width, height = image.size
        image_format = image.format
        mode = image.mode

        # ----------------------------------------------------
        # File information
        # ----------------------------------------------------

        file_size_bytes = os.path.getsize(image_path)
        file_size_kb = round(
            file_size_bytes / 1024,
            2
        )

        # ----------------------------------------------------
        # Aspect ratio
        # ----------------------------------------------------

        aspect_ratio = round(
            width / height,
            2
        )

        # ----------------------------------------------------
        # EXIF metadata
        # ----------------------------------------------------

        exif_data = {}

        exif = image.getexif()

        if exif:

            for tag_id, value in exif.items():

                tag_name = ExifTags.TAGS.get(
                    tag_id,
                    str(tag_id)
                )

                # Keep only simple readable values
                if isinstance(
                    value,
                    (str, int, float)
                ):
                    exif_data[tag_name] = value

        # ----------------------------------------------------
        # Important EXIF fields
        # ----------------------------------------------------

        camera_make = exif_data.get(
            "Make",
            "Not available"
        )

        camera_model = exif_data.get(
            "Model",
            "Not available"
        )

        date_taken = (
            exif_data.get("DateTimeOriginal")
            or exif_data.get("DateTime")
            or "Not available"
        )

        software = exif_data.get(
            "Software",
            "Not available"
        )

        # ----------------------------------------------------
        # Return analysis
        # ----------------------------------------------------

        return {
            "status": "success",

            "analysis": {

                "filename": os.path.basename(
                    image_path
                ),

                "file_size_bytes": file_size_bytes,

                "file_size_kb": file_size_kb,

                "width": width,

                "height": height,

                "format": image_format,

                "color_mode": mode,

                "aspect_ratio": aspect_ratio,

                "exif": {

                    "camera_make": camera_make,

                    "camera_model": camera_model,

                    "date_taken": date_taken,

                    "software": software
                }
            }
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ============================================================
# IMAGE QUALITY ANALYSIS
# ============================================================

def analyze_image_quality(image_path):
    """
    Analyze basic visual properties of an evidence image
    using OpenCV.

    Measures:

    - Width
    - Height
    - Brightness
    - Sharpness
    """

    if not os.path.exists(image_path):

        return {
            "status": "error",
            "message": "Image file not found"
        }

    try:

        # ----------------------------------------------------
        # Read image
        # ----------------------------------------------------

        image = cv2.imread(image_path)

        if image is None:

            return {
                "status": "error",
                "message": "Could not read image"
            }

        # ----------------------------------------------------
        # Convert to grayscale
        # ----------------------------------------------------

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY
        )

        # ----------------------------------------------------
        # Average brightness
        # ----------------------------------------------------

        brightness = float(
            gray.mean()
        )

        # ----------------------------------------------------
        # Image sharpness
        #
        # Laplacian variance is commonly used as a
        # basic focus/sharpness measurement.
        # ----------------------------------------------------

        sharpness = float(
            cv2.Laplacian(
                gray,
                cv2.CV_64F
            ).var()
        )

        # ----------------------------------------------------
        # Image dimensions
        # ----------------------------------------------------

        height, width = image.shape[:2]

        # ----------------------------------------------------
        # Return quality analysis
        # ----------------------------------------------------

        return {

            "status": "success",

            "quality": {

                "width": width,

                "height": height,

                "brightness": round(
                    brightness,
                    2
                ),

                "sharpness": round(
                    sharpness,
                    2
                )
            }
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ============================================================
# FORENSIC IMAGE ENHANCEMENT
# ============================================================

def enhance_image(image_path):
    """
    Enhance an evidence image using OpenCV.

    Processing pipeline:

    1. Read original image
    2. Convert to grayscale
    3. Reduce noise
    4. Improve contrast
    5. Sharpen image
    6. Save enhanced image

    The original evidence file is never modified.
    """

    if not os.path.exists(image_path):

        return {
            "status": "error",
            "message": "Image file not found"
        }

    try:

        # ----------------------------------------------------
        # Read original image
        # ----------------------------------------------------

        image = cv2.imread(
            image_path
        )

        if image is None:

            return {
                "status": "error",
                "message": "Could not read image"
            }

        # ----------------------------------------------------
        # Convert to grayscale
        # ----------------------------------------------------

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY
        )

        # ----------------------------------------------------
        # Noise reduction
        # ----------------------------------------------------

        denoised = cv2.GaussianBlur(
            gray,
            (3, 3),
            0
        )

        # ----------------------------------------------------
        # Contrast enhancement
        # ----------------------------------------------------

        contrast = cv2.equalizeHist(
            denoised
        )

        # ----------------------------------------------------
        # Image sharpening
        # ----------------------------------------------------

        sharpening_kernel = np.array(
            [
                [-1, -1, -1],
                [-1,  9, -1],
                [-1, -1, -1]
            ],
            dtype=np.float32
        )

        sharpened = cv2.filter2D(
            contrast,
            -1,
            sharpening_kernel
        )

        # ----------------------------------------------------
        # Create enhanced directory
        # ----------------------------------------------------

        upload_directory = os.path.dirname(
            image_path
        )

        enhanced_directory = os.path.join(
            upload_directory,
            "enhanced"
        )

        os.makedirs(
            enhanced_directory,
            exist_ok=True
        )

        # ----------------------------------------------------
        # Generate output filename
        # ----------------------------------------------------

        original_filename = os.path.basename(
            image_path
        )

        filename_without_extension = os.path.splitext(
            original_filename
        )[0]

        enhanced_filename = (
            f"{filename_without_extension}_enhanced.png"
        )

        enhanced_path = os.path.join(
            enhanced_directory,
            enhanced_filename
        )

        # ----------------------------------------------------
        # Save enhanced image
        # ----------------------------------------------------

        success = cv2.imwrite(
            enhanced_path,
            sharpened
        )

        if not success:

            return {
                "status": "error",
                "message": "Could not save enhanced image"
            }

        # ----------------------------------------------------
        # Return enhancement information
        # ----------------------------------------------------

        return {

            "status": "success",

            "enhancement": {

                "original_filename":
                    original_filename,

                "enhanced_filename":
                    enhanced_filename,

                "enhanced_path":
                    enhanced_path,

                "operations": [
                    "Grayscale conversion",
                    "Noise reduction",
                    "Contrast enhancement",
                    "Image sharpening"
                ]
            }
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }