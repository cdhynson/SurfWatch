import os

# Change this to your target directory
folder_path = "./train_A3_LT"  # Change this to your target directory

# Loop through each file in the folder
for filename in os.listdir(folder_path):
    if filename.lower().endswith(".jpg") and not filename.startswith("A3_"):
        old_path = os.path.join(folder_path, filename)
        new_filename = "A3_" + filename
        new_path = os.path.join(folder_path, new_filename)
        os.rename(old_path, new_path)
        print(f"Renamed: {filename} -> {new_filename}")

# import os

# # Set your folder path here
# folder_path = "./train_B2_LJS"  # Change this to your target directory

# # Loop through each file in the folder
# for filename in os.listdir(folder_path):
#     if filename.lower().endswith(".jpg") and filename.startswith("B1_"):
#         old_path = os.path.join(folder_path, filename)
#         new_filename = filename.replace("B1_", "B2_", 1)
#         new_path = os.path.join(folder_path, new_filename)
#         os.rename(old_path, new_path)
#         print(f"Renamed: {filename} -> {new_filename}")
