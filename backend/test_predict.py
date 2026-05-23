import sys
import os
import numpy as np
from PIL import Image

# Add root folder to path so we can import backend.model
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.model import load_model, predict_image, CLASSES

def test_inference():
    print("Testing Model Loading and Inference...")
    
    # 1. Load model
    try:
        model = load_model()
        print("SUCCESS: Model loaded successfully.")
    except Exception as e:
        print(f"FAILED: Model loading failed. Error: {e}")
        return False

    # 2. Create dummy random image for testing
    print("Generating dummy retina scan for inference testing...")
    dummy_data = np.random.randint(0, 255, (300, 300, 3), dtype=np.uint8)
    dummy_image = Image.fromarray(dummy_data)

    # 3. Predict image
    try:
        results = predict_image(dummy_image)
        print("SUCCESS: Inference run completed.")
        print("Prediction Output:")
        print(f" - Primary Class: {results['prediction']}")
        print(f" - Confidence: {results['confidence']:.4f}")
        print(" - Top 3 Predictions:")
        for idx, t in enumerate(results['top3']):
            print(f"   {idx+1}. {t['class_name']} ({t['confidence']:.4f})")
            
        # Verify keys
        assert "prediction" in results
        assert "confidence" in results
        assert "top3" in results
        assert "all_predictions" in results
        assert len(results["all_predictions"]) == 8
        
        # Verify confidence is a float and sum is close to 1
        total_prob = sum(x["confidence"] for x in results["all_predictions"])
        assert 0.99 <= total_prob <= 1.01
        
        print("SUCCESS: Output data validation passed.")
        return True
    except Exception as e:
        print(f"FAILED: Inference validation failed. Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_inference()
    sys.exit(0 if success else 1)
