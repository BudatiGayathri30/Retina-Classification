import os
import io
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, UnidentifiedImageError
from backend.model import load_model, predict_image
from backend.database import init_db, add_scan, get_scans, delete_scan, clear_all_scans

app = FastAPI(
    title="Retinal Disease Classification API",
    description="A FastAPI backend to classify retinal fundus images into 8 disease categories using a custom ResNet50 model.",
    version="1.0.0"
)

# CORS middleware configurations to allow frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all origins. Can be restricted to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema for URL prediction
class UrlPredictionRequest(BaseModel):
    url: str

@app.on_event("startup")
def startup_event():
    """
    Load the model eagerly on startup and initialize the SQLite database.
    """
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database initialization failed. Error: {e}")

    try:
        load_model()
    except Exception as e:
        print(f"Warning: Eager model load failed. Will attempt to load on first request. Error: {e}")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "message": "Retinal Disease Classification API is running.",
        "supported_classes": [
            "ageDegeneration (Age-related Degeneration)",
            "cataract (Cataract)",
            "diabetes (Diabetes)",
            "glaucoma (Glaucoma)",
            "hypertension (Hypertension)",
            "myopia (Myopia)",
            "normal (Normal Retina)",
            "others (Other Retinal Anomalies)"
        ]
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Endpoint to predict retinal disease from an uploaded image file.
    """
    # Verify file extension/content type roughly
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not an image."
        )
        
    try:
        # Read file bytes
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Run prediction
        result = predict_image(image)
        
        # Log to database
        try:
            quality = result["quality_check"]
            add_scan(
                filename=file.filename,
                prediction=result["prediction"],
                prediction_raw=result["prediction_raw"],
                confidence=result["confidence"],
                is_proper_fundus=quality["is_proper_fundus"],
                is_blurry=quality["is_blurry"],
                warning_message=quality["warning_message"]
            )
        except Exception as db_err:
            print(f"Warning: Failed to log scan to database: {db_err}")
            
        return result
        
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image format supported by PIL."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during inference: {str(e)}"
        )

@app.post("/predict-url")
async def predict_from_url(request: UrlPredictionRequest):
    """
    Endpoint to predict retinal disease from an image URL.
    Downloads the image on the backend to bypass browser CORS restrictions.
    """
    url = request.url.strip()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL string is empty."
        )
        
    try:
        # Fetch image from URL
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch image from URL. Server returned status code {response.status_code}."
            )
            
        # Parse image
        image = Image.open(io.BytesIO(response.content))
        
        # Run prediction
        result = predict_image(image)
        
        # Log to database
        try:
            quality = result["quality_check"]
            # Get short filename from URL
            filename = url.split("/")[-1] or url
            if len(filename) > 60:
                filename = filename[:57] + "..."
            add_scan(
                filename=filename,
                prediction=result["prediction"],
                prediction_raw=result["prediction_raw"],
                confidence=result["confidence"],
                is_proper_fundus=quality["is_proper_fundus"],
                is_blurry=quality["is_blurry"],
                warning_message=quality["warning_message"]
            )
        except Exception as db_err:
            print(f"Warning: Failed to log scan to database: {db_err}")
            
        return result
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Network error downloading image from URL: {str(e)}"
        )
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The URL does not point to a valid image format supported by PIL."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during inference: {str(e)}"
        )

@app.get("/api/database")
def get_database_records():
    """
    Returns list of all scan records stored in the SQLite database.
    """
    try:
        return get_scans()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch database logs: {str(e)}"
        )

@app.delete("/api/database/{scan_id}")
def delete_database_record(scan_id: int):
    """
    Deletes a specific scan record from the database by ID.
    """
    try:
        success = delete_scan(scan_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scan record with ID {scan_id} not found."
            )
        return {"status": "success", "message": f"Scan {scan_id} deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete scan: {str(e)}"
        )

@app.post("/api/database/clear")
def clear_database_records():
    """
    Clears all records in the SQLite scans table.
    """
    try:
        count = clear_all_scans()
        return {"status": "success", "message": f"Database cleared. Removed {count} records."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear database logs: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
