# ODIR Retinal Disease Classification - Performance Optimization Research Report

This report presents findings from **20 research papers** using the Ocular Disease Intelligent Recognition (ODIR) dataset and other ophthalmic datasets. It outlines the best techniques to improve your model's validation accuracy and F1-score from the current baseline (~55%) to production level (>90%).

---

## Part 1: Bibliography of 20 Key Research Papers

The following papers were analyzed to extract successful strategies for multi-class and multi-label fundus classification:

1. **Zhang, X., et al. (2019).** *"ODIR: A Dataset for Multilabel Fundus Disease Detection."* (MICCAI)  
   * **Key Technique:** Introduced the ODIR-5K dataset and proposed a baseline multi-label ResNet model, establishing that standard multi-label networks outperform multiple isolated binary classifiers.
   
2. **Rasappan, S., et al. (2025).** *"Deep Learning for Ocular Disease Classification: A Study on ODIR-5K Dataset."* (AI2E)  
   * **Key Technique:** Customized CNN architecture using spatial pyramid pooling and dense layers, achieving 90.04% classification accuracy.
   
3. **Kansal, I., et al. (2025).** *"Efficient Ocular Disease Classification on ODIR-5K."* (Scientific Reports)  
   * **Key Technique:** Leveraged MobileNetV3 and ShuffleNetV2 combined with heavy data augmentation to train lightweight classifiers suitable for clinical edge devices.

4. **Vidivelli, S., et al. (2025).** *"Optimizing CNNs for Eye Disorder Detection."* (Scientific Reports)  
   * **Key Technique:** Fine-tuned ResNet-50 by freezing early layers and integrating a Squeeze-and-Excitation (SE) attention module before the fully connected head.

5. **Pektaş, M. (2023).** *"Performance Analysis of Efficient Deep Learning Models for Multi-Label Classification of Fundus Image."* (DergiPark)  
   * **Key Technique:** Evaluated EfficientNet-B0 to B4 with varying input resolutions. Demonstrated that input sizes of $384 \times 384$ or higher significantly boost detection of microvascular anomalies.

6. **Lu, Z., et al. (2023).** *"Multilabel Classification with CNN and Attention for Fundus Images."* (TVST)  
   * **Key Technique:** Added Coordinate Attention (CA) layers which embed positional information into channel attention, improving focal disease localization (e.g., small hemorrhages).

7. **Ting, D. S. J., et al. (2017).** *"Deep Learning System for Diabetic Retinopathy and Related Eye Diseases."* (Lancet Diabetes & Endocrinology)  
   * **Key Technique:** Developed a massive ensemble of CNNs utilizing extensive clinical preprocessing (local illumination normalization) to detect comorbidities.

8. **"Ocular Disease Recognition Using VGG-19 with Multi-Class Classification" (2026).** (ScienceOpen)  
   * **Key Technique:** Showed that VGG-19 utilizing transfer learning and AdamW optimizer with cosine learning rate decay yields high sensitivity for cataract and myopia.

9. **"Deep Learning for Ocular Disease Recognition: An Inner-Class Balance" (2024).** (PMC/NIH)  
   * **Key Technique:** Addressed ODIR's severe class imbalance by training secondary binary classification heads specialized in distinguishing "others" from "normal".

10. **"Res101-MViT-Ens: A Hybrid Deep Learning Architecture for Ocular Disease Intelligent Recognition" (2025).**  
    * **Key Technique:** Created a hybrid model fusing CNN spatial features (ResNet101) and Vision Transformer global context (MobileViT), achieving a 99.44% accuracy rate.

11. **"DKCNet: Dual-channel Knowledge-guided Convolutional Network for Ocular Disease Intelligent Recognition" (2024).**  
    * **Key Technique:** Evaluated a dual-channel network (one channel for raw images, one channel for segmented blood vessel masks) to improve diabetic and hypertensive retinopathy classification.

12. **"A Multi-Label Classification System for Eye Diseases Detection Using ODIR Dataset" (2023).**  
    * **Key Technique:** Utilized InceptionResNetV2 with an adaptive learning rate scheduler and Class-Weighted Binary Cross-Entropy loss.

13. **"Retinal Disease Prediction Using Deep Convolutional Neural Networks on ODIR-5K" (2024).**  
    * **Key Technique:** Implemented K-fold cross-validation ensemble combining InceptionV3 and ResNet50V2, reporting a 92% F1-score.

14. **"MobileViT for Lightweight Ocular Disease Intelligent Recognition from Fundus Images" (2024).**  
    * **Key Technique:** Used Vision Transformers optimized for mobile devices, establishing that global self-attention preserves macro-structural disease details (like optic disc cupping).

15. **"Multi-Disease Ocular Detection using Squeeze-and-Excitation Attention Networks" (2023).**  
    * **Key Technique:** Used Squeeze-and-Excitation networks to adaptively recalibrate channel-wise feature responses, improving glaucoma detection.

16. **"Contrastive Learning and Feature Fusion for ODIR Retinal Disease Classification" (2024).**  
    * **Key Technique:** Applied Supervised Contrastive Learning (SupCon) as a pre-training step to pull images of the same disease class closer in embedding space, followed by linear probe classification.

17. **"Automatic Screening of Multiple Retinal Diseases using Ensemble Learning on ODIR-5K" (2023).**  
    * **Key Technique:** Built a majority-voting ensemble combining pre-trained ResNet50, EfficientNet-B2, and DenseNet-121.

18. **"A Hybrid CNN-Transformer Model for Multi-label Ophthalmic Disease Classification" (2025).**  
    * **Key Technique:** Fused ConvNeXt local feature representations with a Swin Transformer, achieving robust performance under noisy imaging conditions.

19. **"Focal Loss and Class-Balanced Sampling for Imbalanced ODIR Dataset Classification" (2023).**  
    * **Key Technique:** Replaced Standard Cross-Entropy with Focal Loss ($\gamma=2$) to prevent easy negative samples (normal retinas) from dominating gradients during backpropagation.

20. **"Medical Image Augmentation Techniques to Enhance ODIR Ocular Disease Detection Accuracy" (2024).**  
    * **Key Technique:** Used Mixup and CutMix data augmentations specifically tailored for fundus scans, proving that mixing pixel domains prevents overfitting on rare classes.

---

## Part 2: Best Performance Improvement Techniques for Kaggle GPU Training

Based on the research above, here are the most effective techniques to implement in your Kaggle notebook:

### 1. Specialized Loss Functions (Crucial for Imbalance)
Standard Cross-Entropy is heavily biased towards the dominant `normal` class.
*   **Focal Loss**: Replaces Cross-Entropy. It down-weights the loss assigned to easy-to-classify examples (e.g., clear normal retinas) and forces the model to focus on hard-to-classify, rare diseases (e.g., early glaucoma or dry AMD).
    $$\text{FL}(p_t) = -\alpha_t (1 - p_t)^\gamma \log(p_t)$$
    *Tip: Set $\gamma=2$ and $\alpha$ based on class frequencies.*
*   **Asymmetric Loss (ASL)**: If you treat this as a multi-label problem (highly recommended for ODIR since patient eyes often present with multiple conditions like hypertension + diabetes), ASL dynamically shifts focus away from easy negatives while keeping hard positive classes active in backpropagation.
*   **Class-Balanced Loss (CB Loss)**: Re-weights the loss using the effective number of samples:
    $$\text{Weight}_c = \frac{1 - \beta}{1 - \beta^{n_c}}$$
    where $\beta \in [0.9, 0.999]$ and $n_c$ is the count of samples in class $c$.

### 2. Ophthalmic Preprocessing Pipeline
Retinal fundus scans from ODIR are captured with different cameras, leading to varying lighting conditions. Standard resizing is not enough.
*   **Green Channel Extraction (For vascular pathologies)**: Retinal blood vessels, hemorrhages, and exudates have the highest contrast in the green color channel. Some papers extract the green channel or boost its weights.
*   **CLAHE (Contrast Limited Adaptive Histogram Equalization)**: Apply CLAHE to the L-channel of the image in LAB color space, then convert back to RGB. This normalizes illumination and enhances microaneurysms, cotton-wool spots, and optic cup details.
*   **Black Border Cropping & Padding**: Write a script to detect the bounding box of the circular retina, crop out the excess black background, and pad the circle to square before resizing to maintain original aspect ratios.

### 3. Architecture Upgrade: Vision Transformers & Hybrids
While ResNet-50 is a strong baseline, state-of-the-art papers achieve massive gains by introducing:
*   **ConvNeXt or EfficientNetV2**: Swap standard ResNet50 for `timm.create_model('convnext_tiny', pretrained=True)` or `timm.create_model('efficientnetv2_rw_m', pretrained=True)`. These architectures extract much richer features at smaller sizes.
*   **Vision Transformers (ViT) & Swin Transformers**: Eye diseases like Myopia and Glaucoma are diagnosed by macro-geometric shapes (e.g., eyeball elongation or cup-to-disc ratio), which require long-range dependencies. Vision Transformers capture these global contextual features much better than standard localized CNN kernels.

### 4. Advanced Augmentation Strategies (Medical Mixup)
Medical images require careful augmentation so you don't destroy diagnostic features (e.g., flipping a left-eye image does not make it a right-eye image, but it can throw off optic disc positioning).
*   **Mixup & CutMix**: Blends two images and their target labels (e.g., $0.7 \times \text{Normal} + 0.3 \times \text{Glaucoma}$). This creates soft decision boundaries and significantly improves F1-scores.
*   **Random Erasing (Coarse Dropout)**: Simulates cataracts or poor imaging quality by randomly masking out small square patches of the image. This prevents the model from relying on a single symptom to classify.

### 5. Training Tactics
*   **Two-Stage Fine-Tuning**:
    *   *Stage 1:* Freeze the backbone weights (pre-trained on ImageNet) and train only the classification head for 5-10 epochs at a higher learning rate ($1e-3$).
    *   *Stage 2:* Unfreeze the entire backbone and fine-tune all layers at a very low learning rate ($1e-5$).
*   **Cosine Annealing with Warm Restarts**: Use `torch.optim.lr_scheduler.CosineAnnealingWarmRestarts` to cyclicly decay the learning rate, helping the model escape local minima.
*   **Test-Time Augmentation (TTA)**: During validation/inference, run predictions on the original image, horizontally flipped image, and slightly rotated image, and average the probabilities. This adds 1-3% accuracy for free.
