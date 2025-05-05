import os
import shutil

# === SETTINGS ===
frames_base = "frames"  # Your existing frames directory
train_base = "train_frames"  # Where to put every 10th frame

# Create train output folder if not exists
os.makedirs(train_base, exist_ok=True)

# Loop through each folder inside frames/
for folder in os.listdir(frames_base):
    folder_path = os.path.join(frames_base, folder)
    
    if not os.path.isdir(folder_path):
        continue  # Skip files, only work with directories

    train_folder_name = f"train_{folder}"
    train_folder_path = os.path.join(train_base, train_folder_name)

    # === Skip if train folder exists and has frames ===
    if os.path.exists(train_folder_path) and any(fname.endswith('.jpg') for fname in os.listdir(train_folder_path)):
        print(f"[SKIP] {train_folder_name}: frames already exist")
        continue

    os.makedirs(train_folder_path, exist_ok=True)

    # Sort frames in order
    frames = sorted([f for f in os.listdir(folder_path) if f.endswith(".jpg")])

    for idx, frame_file in enumerate(frames):
        if idx % 10 == 0:
            src_path = os.path.join(folder_path, frame_file)
            dst_path = os.path.join(train_folder_path, frame_file)
            shutil.copy2(src_path, dst_path)

    print(f"[DONE] Copied every 10th frame from {folder} to {train_folder_name}")
