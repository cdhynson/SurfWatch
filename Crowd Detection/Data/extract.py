import cv2
import os

# ==== SETTINGS ====
video_path = "(0415-1026) Lower Trestles (1920x1080).mp4"
output_dir = "frames"   # You can change this if you want

# ==== Create output folder if not exists ====
os.makedirs(output_dir, exist_ok=True)

# ==== Load video ====
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
frame_interval = int(fps)  # 1 frame per second

frame_count = 0
saved_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    if frame_count % frame_interval == 0:
        frame_name = f"{output_dir}/frame_{saved_count:04d}.jpg"
        cv2.imwrite(frame_name, frame)
        saved_count += 1
    frame_count += 1

cap.release()
print(f"[INFO] Saved {saved_count} frames to '{output_dir}'")
