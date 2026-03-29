import pandas as pd
import shutil
import os
from pathlib import Path
import random

# Configuration
DATASET_DIR = Path('dataset/preprocessed_images')
LABELS_FILE = Path('dataset/labels.csv')
MAX_IMAGES_PER_CLASS = 1500  # Subset size for quick training

def organize_dataset():
    # Load labels
    df = pd.read_csv(LABELS_FILE)
    
    # Identify Normal and Cataract
    # N column: Normal, C column: Cataract
    normal_ids = df[df['N'] == 1]['ID'].tolist()
    cataract_ids = df[df['C'] == 1]['ID'].tolist()
    
    print(f"Total Normal Patients: {len(normal_ids)}")
    print(f"Total Cataract Patients: {len(cataract_ids)}")
    
    # Create subdirectories
    (DATASET_DIR / 'normal').mkdir(exist_ok=True)
    (DATASET_DIR / 'cataract').mkdir(exist_ok=True)
    
    # Counter for stats
    normal_count = 0
    cataract_count = 0
    
    # Shuffle IDs to get a random subset if needed
    random.seed(42)
    random.shuffle(normal_ids)
    random.shuffle(cataract_ids)
    
    # Helper to move images for a patient
    def process_patient(patient_id, target_folder, count, limit):
        if count >= limit:
            return count
            
        # ODIR-5K filenames usually: {ID}_left.jpg and {ID}_right.jpg
        for eye in ['left', 'right']:
            filename = f"{patient_id}_{eye}.jpg"
            src = DATASET_DIR / filename
            if src.exists():
                dst = DATASET_DIR / target_folder / filename
                if not dst.exists():
                    shutil.copy2(src, dst)
                count += 1
        return count

    print("Organizing Normal images...")
    for pid in normal_ids:
        normal_count = process_patient(pid, 'normal', normal_count, MAX_IMAGES_PER_CLASS)
        if normal_count >= MAX_IMAGES_PER_CLASS:
            break
            
    print("Organizing Cataract images...")
    for pid in cataract_ids:
        cataract_count = process_patient(pid, 'cataract', cataract_count, MAX_IMAGES_PER_CLASS)
        if cataract_count >= MAX_IMAGES_PER_CLASS:
            break
            
    print(f"Successfully organized {normal_count} normal and {cataract_count} cataract images.")

if __name__ == "__main__":
    organize_dataset()
