import os
import torch
import timm
from PIL import Image
from torchvision import transforms
import torch.nn.functional as F
import numpy as np
import cv2

# Class names mapping to full names for display
CLASSES = [
    'ageDegeneration',  # Age-related Degeneration
    'cataract',         # Cataract
    'diabetes',         # Diabetes
    'glaucoma',         # Glaucoma
    'hypertension',     # Hypertension
    'myopia',           # Myopia
    'normal',           # Normal
    'others'            # Others
]

# Map internal names to clean user-friendly labels
CLASS_MAPPING = {
    'ageDegeneration': 'Age-related Degeneration',
    'cataract': 'Cataract',
    'diabetes': 'Diabetes',
    'glaucoma': 'Glaucoma',
    'hypertension': 'Hypertension',
    'myopia': 'Myopia',
    'normal': 'Normal Retina',
    'others': 'Other Retinal Anomalies'
}

# Image transformations for ResNet50
preprocess_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# Global variables for model and device
model = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_model():
    """
    Loads the ResNet50 model weights from best_model.pth.
    Looks in multiple locations (backend dir, project root) to find the model.
    """
    global model
    if model is not None:
        return model

    # Look for model file in various possible locations
    possible_paths = [
        # Relative to current script
        os.path.join(os.path.dirname(__file__), '..', 'best_model.pth'),
        os.path.join(os.path.dirname(__file__), 'best_model.pth'),
        # Absolute path in workspace
        r"C:\Users\budat\OneDrive\Desktop\Retina classification\best_model.pth",
        'best_model.pth'
    ]

    model_path = None
    for path in possible_paths:
        if os.path.exists(path):
            model_path = path
            break

    if model_path is None:
        raise FileNotFoundError(
            f"Could not find best_model.pth in any of the checked locations: {possible_paths}"
        )

    print(f"Loading PyTorch ResNet50 model from: {model_path} onto device: {device}")
    
    # Initialize the architecture matching timm's setup in training
    model = timm.create_model('resnet50', pretrained=False, num_classes=len(CLASSES))
    
    # Load state dict
    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    print("Model loaded successfully!")
    return model

def check_image_quality(image: Image.Image):
    """
    Helper function to check if the uploaded image is a valid, clear retinal fundus scan.
    Checks:
    1. Color profile (retinal fundus scans are reddish/orange; average Red > Green and Red > Blue).
    2. Exposure (checks if too dark/bright).
    3. Blurriness (variance of Laplacian).
    """
    # Convert PIL to RGB, then to numpy array
    img_np = np.array(image.convert("RGB"))
    
    # 1. Color distribution analysis
    avg_r = np.mean(img_np[:, :, 0])
    avg_g = np.mean(img_np[:, :, 1])
    avg_b = np.mean(img_np[:, :, 2])
    
    # Retinal fundus scans are characterized by high red channel values (blood and retinal pigment).
    # If R channel is not dominant, or if colors are completely uniform (e.g. grayscale), it's not a standard fundus.
    is_proper_color = (avg_r > avg_g + 5) and (avg_r > avg_b + 10)
    
    # 2. Exposure check
    avg_brightness = (avg_r + avg_g + avg_b) / 3.0
    is_dark = avg_brightness < 20.0
    is_washed_out = avg_brightness > 220.0
    
    # 3. Blurriness check using Laplacian variance
    # Convert to grayscale first
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    # Compute Laplacian variance
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Threshold of 45.0 is standard for detecting blurriness in medical photos.
    is_blurry = lap_var < 45.0
    
    # Consolidate checks
    is_valid_fundus = is_proper_color and (not is_dark) and (not is_washed_out)
    
    warning_message = None
    if not is_valid_fundus:
        if is_dark:
            warning_message = "The image is too dark. Please ensure the retinal scan is properly illuminated."
        elif is_washed_out:
            warning_message = "The image is overexposed (too bright). Please ensure the scan is not washed out."
        else:
            warning_message = "The uploaded file does not match a typical reddish-orange retinal fundus scan profile."
    elif is_blurry:
        warning_message = "The image appears blurry or unclear. This might degrade classification accuracy. Consider using a sharper scan."
        
    return {
        "is_proper_fundus": bool(is_valid_fundus),
        "is_blurry": bool(is_blurry),
        "laplacian_variance": float(lap_var),
        "average_brightness": float(avg_brightness),
        "warning_message": warning_message
    }

def predict_image(image: Image.Image):
    """
    Takes a PIL Image, preprocesses it, runs inference, and returns prediction dict.
    """
    global model
    if model is None:
        load_model()
        
    # Check image quality
    quality_result = check_image_quality(image)
        
    # Convert image to RGB (required for 3-channel input)
    if image.mode != "RGB":
        image = image.convert("RGB")
        
    # Preprocess image
    tensor_img = preprocess_transform(image).unsqueeze(0).to(device)
    
    # Forward pass
    with torch.no_grad():
        outputs = model(tensor_img)
        probabilities = F.softmax(outputs, dim=1)[0]
        
    # Extract predicted class
    pred_idx = torch.argmax(probabilities).item()
    pred_class_raw = CLASSES[pred_idx]
    pred_class_clean = CLASS_MAPPING.get(pred_class_raw, pred_class_raw)
    confidence = probabilities[pred_idx].item()
    
    # Calculate top-3 predictions
    top_probs, top_indices = torch.topk(probabilities, 3)
    top3_list = []
    for prob, idx in zip(top_probs, top_indices):
        class_raw = CLASSES[idx.item()]
        top3_list.append({
            "class_raw": class_raw,
            "class_name": CLASS_MAPPING.get(class_raw, class_raw),
            "confidence": prob.item()
        })
        
    # Get all 8 probabilities for detailed bar charts in frontend
    all_probs = []
    for idx, prob in enumerate(probabilities):
        class_raw = CLASSES[idx]
        all_probs.append({
            "class_raw": class_raw,
            "class_name": CLASS_MAPPING.get(class_raw, class_raw),
            "confidence": prob.item()
        })
        
    # Sort all probabilities descending
    all_probs = sorted(all_probs, key=lambda x: x["confidence"], reverse=True)
        
    return {
        "prediction": pred_class_clean,
        "prediction_raw": pred_class_raw,
        "confidence": confidence,
        "top3": top3_list,
        "all_predictions": all_probs,
        "quality_check": quality_result
    }
