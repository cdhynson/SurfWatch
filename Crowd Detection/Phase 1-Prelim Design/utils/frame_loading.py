import os
import random

def load_frames(folder_path, prefix=None, limit=None, sort=True, randomize=False, verbose=True):
    """
    Loads image file paths from a folder.

    Args:
        folder_path (str): Path to the folder with image frames.
        prefix (str, optional): Only include files starting with this prefix (e.g., "LT_").
        limit (int, optional): Maximum number of frames to return.
        sort (bool): Whether to sort the filenames alphabetically (ignored if randomize=True).
        randomize (bool): If True, randomly shuffle the frames before limiting.
        verbose (bool): If True, print out which frames are being loaded.

    Returns:
        List[str]: List of image file paths.
    """
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"Folder does not exist: {folder_path}")

    files = [f for f in os.listdir(folder_path) if f.endswith(('.jpg', '.png'))]

    if prefix:
        files = [f for f in files if f.startswith(prefix)]

    if randomize:
        random.shuffle(files)
    elif sort:
        files.sort()

    if limit:
        files = files[:limit]

    frame_paths = [os.path.join(folder_path, f) for f in files]

    if verbose:
        print(f"[INFO] Loaded {len(frame_paths)} frame(s):")
        for f in frame_paths:
            print(f"   → {os.path.basename(f)}")

    return frame_paths