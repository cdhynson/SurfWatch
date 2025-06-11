# from ultralytics import YOLO
# import cv2
# import os
# import numpy as np
# import random

# # === CONFIGURATION ===
# video_path = 'short1.mp4'
# model_path = '../final.pt'
# output_dir = 'preview_frames'
# num_random_frames = 5

# # ROI: (x1, y1) = top-left, (x2, y2) = bottom-right
# x1, y1, x2, y2 = 0, 375, 1920, 550  # Update based on your video resolution

# # === LOAD MODEL ===
# model = YOLO(model_path)

# # === OPEN VIDEO ===
# cap = cv2.VideoCapture(video_path)
# total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# if total_frames < num_random_frames:
#     raise ValueError(f"Video only has {total_frames} frames — can't sample {num_random_frames} random ones.")

# # === SELECT RANDOM FRAMES ===
# random_frames = sorted(random.sample(range(total_frames), num_random_frames))
# print(f"🔍 Selected random frames: {random_frames}")

# # === CREATE OUTPUT DIRECTORY ===
# os.makedirs(output_dir, exist_ok=True)

# # === PROCESS RANDOM FRAMES ===
# for idx, frame_idx in enumerate(random_frames):
#     cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
#     ret, frame = cap.read()
#     if not ret:
#         print(f"⚠️ Failed to read frame {frame_idx}")
#         continue

#     # === Extract ROI and run detection
#     roi_frame = frame[y1:y2, x1:x2]
#     results = model.predict(roi_frame, verbose=False)

#     # === Annotate frame
#     annotated = frame.copy()

#     # Draw ROI box on full frame
#     cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 0, 0), 2)  # Blue ROI box

#     # Draw detection results (with ROI offset)
#     for box in results[0].boxes:
#         xyxy = box.xyxy[0].cpu().numpy().astype(int)
#         class_id = int(box.cls[0].item())
#         conf = float(box.conf[0].item())
#         label = model.names[class_id]

#         xmin, ymin, xmax, ymax = xyxy
#         xmin += x1
#         xmax += x1
#         ymin += y1
#         ymax += y1

#         cv2.rectangle(annotated, (xmin, ymin), (xmax, ymax), (0, 255, 0), 1)
#         cv2.putText(annotated, f"{label} {conf:.2f}", (xmin, ymin - 5),
#                     cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

#     # === Save annotated frame
#     out_path = os.path.join(output_dir, f"frame_{frame_idx}.jpg")
#     cv2.imwrite(out_path, annotated)
#     print(f"✅ Saved {out_path}")

# cap.release()
# cv2.destroyAllWindows()


from ultralytics import YOLO
import cv2
import os

# === CONFIGURATION ===
video_path = 'test_vid1.mp4'              # Input video
output_path = 'showcase1.mp4'        # Output video
model_path = '../final.pt'             # Trained model

# === ROI Settings (span full width, limited height)
x1, y1, x2, y2 = 0, 255, 1920, 400  # x2 will be set dynamically from frame width

# === LOAD MODEL ===
model = YOLO(model_path)

# === OPEN VIDEO ===
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
x2 = width  # Set x2 to full frame width if not already specified

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

frame_count = 0
print("🚀 Starting full video processing...")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1

    # Extract ROI
    roi_frame = frame[y1:y2, x1:x2]

    # Run detection on ROI only
    results = model.predict(roi_frame, verbose=False)

    # Annotate full frame
    annotated = frame.copy()

    # Draw ROI box on frame
    # cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 0, 0), 2)  # Blue ROI

    # Draw detection boxes inside ROI
    for box in results[0].boxes:
        xyxy = box.xyxy[0].cpu().numpy().astype(int)
        class_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        label = model.names[class_id]

        # Offset back to full-frame coordinates
        xmin, ymin, xmax, ymax = xyxy
        xmin += x1
        xmax += x1
        ymin += y1
        ymax += y1

        # Draw detection
        cv2.rectangle(annotated, (xmin, ymin), (xmax, ymax), (0, 255, 0), 1)
        cv2.putText(annotated, f"{label} {conf:.2f}", (xmin, ymin - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    out.write(annotated)

    if frame_count % 50 == 0:
        print(f"Processed frame {frame_count}")

cap.release()
out.release()
cv2.destroyAllWindows()

print(f"✅ Done! Annotated video saved to: {output_path}")
