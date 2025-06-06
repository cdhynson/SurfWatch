from ultralytics import YOLO
import cv2
import os

# === CONFIGURATION ===
video_path = 'short.mp4'     # Input video file
output_path = 'demo.mp4'   # Output video file
model_path = '../final.pt'                         # Path to trained YOLO model

# === LOAD MODEL ===
model = YOLO(model_path)

# === OPEN VIDEO ===
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# === VIDEO WRITER SETUP ===
fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # You can use 'XVID' or 'avc1' too
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

# === INFERENCE FRAME-BY-FRAME ===
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)

    # Draw results (bounding boxes, labels) on the frame
    annotated_frame = results[0].plot()  # This auto-draws on the frame

    out.write(annotated_frame)  # Write annotated frame to output video

# === CLEANUP ===
cap.release()
out.release()
cv2.destroyAllWindows()

print(f"✅ Detection complete. Output saved to: {output_path}")
