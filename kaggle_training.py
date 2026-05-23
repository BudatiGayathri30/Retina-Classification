import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from sklearn.metrics import accuracy_score
from tqdm import tqdm
import timm

# ==========================================
# GLOBAL CONSTANTS
# ==========================================
IMG_SIZE = 224
BATCH_SIZE = 16  # High batch size for stable gradients
EPOCHS = 30
DATASET_PATH = "/kaggle/input/datasets/tanjemahamed/odir5k-classification/datasets"
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# ==========================================================
# 1. OPTIMIZATION: Transform Pipeline (Resolved Color Shift)
# ==========================================================
# We removed CLAHE because pre-trained ImageNet weights are sensitive to colors.
# Standard ImageNet normalization is kept to leverage pre-trained features.

# --- OLD LINES (Using CLAHE which caused domain shift) ---
# train_transform = transforms.Compose([
#     transforms.Resize((IMG_SIZE, IMG_SIZE)),
#     CLAHETransform(clip_limit=2.0),
#     transforms.RandomHorizontalFlip(p=0.5),
#     transforms.RandomVerticalFlip(p=0.5),
#     transforms.RandomRotation(15),
#     transforms.ColorJitter(brightness=0.2, contrast=0.2),
#     transforms.ToTensor(),
#     transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
# ])

# --- NEW IMPLEMENTATION (Standard Augmentation + ImageNet Normalization) ---
train_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.5),
    transforms.RandomRotation(15),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],  # Matches pre-trained models
        std=[0.229, 0.224, 0.225]
    )
])

valid_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ==========================================
# DATA LOADING & SPLITTING
# ==========================================
print("Loading dataset from path:", DATASET_PATH)
temp_dataset = datasets.ImageFolder(DATASET_PATH)
NUM_CLASSES = len(temp_dataset.classes)
print(f"Detected {NUM_CLASSES} classes: {temp_dataset.classes}")

dataset_size = len(temp_dataset)
train_size = int(0.8 * dataset_size)
valid_size = dataset_size - train_size

# Set seeds for reproducibility
torch.manual_seed(42)
np.random.seed(42)

indices = list(range(dataset_size))
np.random.shuffle(indices)
train_idx, valid_idx = indices[:train_size], indices[train_size:]

class TransformSubset(torch.utils.data.Dataset):
    def __init__(self, dataset, indices, transform):
        self.dataset = dataset
        self.indices = indices
        self.transform = transform

    def __getitem__(self, idx):
        path, label = self.dataset.samples[self.indices[idx]]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label

    def __len__(self):
        return len(self.indices)

train_dataset = TransformSubset(temp_dataset, train_idx, train_transform)
valid_dataset = TransformSubset(temp_dataset, valid_idx, valid_transform)

# ========================================================
# 2. OPTIMIZATION: Data Loading (Resolved Over-correction)
# ========================================================
# Reverted WeightedRandomSampler to standard Shuffle=True.
# This prevents the model from ignoring the dominant 'normal' class,
# which directly maximizes validation Accuracy on the natural dataset.

# --- OLD LINES (WeightedRandomSampler caused over-correction) ---
# train_loader = DataLoader(
#     train_dataset,
#     batch_size=BATCH_SIZE,
#     sampler=sampler,
#     num_workers=2,
#     pin_memory=True
# )

# --- NEW IMPLEMENTATION (Standard Shuffled Loading) ---
train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=2,
    pin_memory=True
)

valid_loader = DataLoader(
    valid_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=2,
    pin_memory=True
)

# ==========================================================
# 3. OPTIMIZATION: Model Initialization & Pre-trained weights
# ==========================================================
print("Initializing pre-trained ResNet-50 model...")
model = timm.create_model(
    'resnet50',
    pretrained=True,  # Kept: Pre-trained weights are essential for high accuracy
    num_classes=NUM_CLASSES
)
model = model.to(device)

# ==========================================================
# 4. OPTIMIZATION: Loss & Optimizer (Standardized for Accuracy)
# ==========================================================
# Swapped Focal Loss back to CrossEntropyLoss.
# Standard CrossEntropy directly optimizes for maximum overall classification accuracy.

# --- OLD LINES (Focal Loss with class weights) ---
# criterion = FocalLoss(alpha=device_class_weights, gamma=2.0)
# optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
# scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)

# --- NEW IMPLEMENTATION (Standard CrossEntropy + Adam + MultiStepLR) ---
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(
    model.parameters(),
    lr=1e-4  # Standard learning rate for fine-tuning
)

# Mild Step scheduler for stable optimization
scheduler = optim.lr_scheduler.MultiStepLR(
    optimizer,
    milestones=[15, 25],
    gamma=0.1
)

# ==========================================
# TRAINING & VALIDATION LOOPS
# ==========================================
def train_one_epoch(model, loader, epoch_idx):
    model.train()
    running_loss = 0.0
    preds_list = []
    labels_list = []

    progress_bar = tqdm(loader, desc=f"Train Epoch {epoch_idx+1}/{EPOCHS}")
    for images, labels in progress_bar:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        preds = torch.argmax(outputs, dim=1)

        preds_list.extend(preds.cpu().numpy())
        labels_list.extend(labels.cpu().numpy())
        
        progress_bar.set_postfix(loss=f"{loss.item():.4f}")

    acc = accuracy_score(labels_list, preds_list)
    return running_loss / len(loader), acc

def validate(model, loader, epoch_idx):
    model.eval()
    running_loss = 0.0
    preds_list = []
    labels_list = []

    progress_bar = tqdm(loader, desc=f"Val Epoch {epoch_idx+1}/{EPOCHS}")
    with torch.no_grad():
        for images, labels in progress_bar:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)

            preds_list.extend(preds.cpu().numpy())
            labels_list.extend(labels.cpu().numpy())
            
            progress_bar.set_postfix(loss=f"{loss.item():.4f}")

    acc = accuracy_score(labels_list, preds_list)
    return running_loss / len(loader), acc

# Main Training Loop
best_acc = 0.0
print(f"Beginning training on device: {device}...")

for epoch in range(EPOCHS):
    train_loss, train_acc = train_one_epoch(model, train_loader, epoch)
    valid_loss, valid_acc = validate(model, valid_loader, epoch)
    
    # Step the learning rate scheduler
    scheduler.step()
    current_lr = optimizer.param_groups[0]['lr']

    print(f"\n--- Epoch {epoch+1} Summary ---")
    print(f"Learning Rate: {current_lr:.6f}")
    print(f"Train Loss   : {train_loss:.4f} | Train Acc: {train_acc:.4f}")
    print(f"Valid Loss   : {valid_loss:.4f} | Valid Acc: {valid_acc:.4f}")

    if valid_acc > best_acc:
        best_acc = valid_acc
        torch.save(model.state_dict(), 'best_model.pth')
        print(f"New Best Accuracy reached! Model saved to best_model.pth")
    print("----------------------------\n")

print(f"Training completed. Best validation accuracy: {best_acc:.4f}")
