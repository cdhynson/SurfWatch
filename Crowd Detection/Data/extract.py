import os
import cv2

# === SETTINGS ===
video_dir = "test videos"
output_base = "frames"
fps_to_sample = 1  # Extract 1 frame per second

# Create output folder if it doesn't exist
os.makedirs(output_base, exist_ok=True)

def get_output_folder_name(filename):
    """
    Parse the filename to create output folder like A1_LT
    """
    filename = filename.replace(".mp4", "")
    filename = filename.replace("(", "").replace(")", "")  # Remove all parentheses first
    parts = filename.split()
    tag = parts[0]  # A1, B2, etc.

    # Now find the beach name words
    beach_words = []
    for part in parts[1:]:
        if "-" in part and part.replace("-", "").isdigit():
            continue  # Skip date
        if "x" in part and part.replace("x", "").isdigit():
            break  # Stop at resolution
        beach_words.append(part)

    initials = "".join(word[0].upper() for word in beach_words)
    return f"{tag}_{initials}"

# === Loop through all videos ===
for video_file in os.listdir(video_dir):
    if not video_file.endswith(".mp4"):
        continue

    video_path = os.path.join(video_dir, video_file)
    folder_name = get_output_folder_name(video_file)
    output_folder = os.path.join(output_base, folder_name)

    # === Skip if output folder exists and has frames ===
    if os.path.exists(output_folder) and any(fname.endswith('.jpg') for fname in os.listdir(output_folder)):
        print(f"[SKIP] {folder_name}: frames already extracted in {output_folder}")
        continue

    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps // fps_to_sample)

    frame_count = 0
    saved_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % frame_interval == 0:
            frame_name = f"frame_{saved_count:04d}.jpg"
            save_path = os.path.join(output_folder, frame_name)
            cv2.imwrite(save_path, frame)
            saved_count += 1
        frame_count += 1

    cap.release()
    print(f"[DONE] {folder_name}: Extracted {saved_count} frames from {video_file}")