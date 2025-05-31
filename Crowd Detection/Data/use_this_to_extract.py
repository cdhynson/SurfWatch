import cv2
import os

def extract_frames(video_path, output_folder, interval_seconds=10):
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)

    # Load video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Cannot open video file.")
        return

    # Get frame rate (fps) and total frames
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_seconds = total_frames / fps

    print(f"Video FPS: {fps}")
    print(f"Total Duration: {duration_seconds:.2f} seconds")

    frame_interval = int(fps * interval_seconds)
    frame_id = 0
    saved_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_id % frame_interval == 0:
            filename = os.path.join(output_folder, f"frame_{frame_id}.jpg")
            cv2.imwrite(filename, frame)
            saved_count += 1
            print(f"Saved: {filename}")

        frame_id += 1

    cap.release()
    print(f"\nDone. Extracted {saved_count} frames.")

# Example usage
if __name__ == "__main__":
    video_path = "test_vid1.mp4"  # Replace with your file path
    output_folder = "test_frames" \
    ""
    extract_frames(video_path, output_folder, interval_seconds=10)
