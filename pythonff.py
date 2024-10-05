import logging
import sys
import time
import numpy as np
import subprocess
import os

# Ensure that the ffmpeg executable in the current directory is included in the PATH
os.environ["PATH"] += os.pathsep + './'

# Set up logging
logger = logging.getLogger("Writer")
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s %(levelname)-8s %(module)s %(message)s")
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Video dimensions
W = 1920
H = 1080

# Construct the ffmpeg command
cmd = [
    './ffmpeg',  # Path to the ffmpeg executable in the current directory
    '-f', 'rawvideo',           # Input format
    '-framerate', '30',         # Input frame rate
    '-pix_fmt', 'rgb24',        # Input pixel format
    '-s', f'{W}x{H}',           # Input resolution
    '-i', 'pipe:',              # Input comes from stdin (pipe)
    '-vcodec', 'libx264',       # Video codec for encoding
    '-pix_fmt', 'yuv420p',         # Output pixel format
    '-y',                       # Overwrite output file if it exists
    '-preset', 'ultrafast',  # Encoding speed/quality tradeoff

    "-bt","4M",
    "-b:a", "2M",
    "-pass","1",
    "-coder","0",
    "-bf","0",
    "-flags",
    "-loop",
    "-wpredp","0",
    "-an",
    'mozilla_story.mp4'                   # Output file name
]

# Start the ffmpeg subprocess
process = subprocess.Popen(cmd, stdin=subprocess.PIPE)

frames = 0
start = time.time()
import PIL.Image
pic = PIL.Image.open('image.png')
pic = pic.convert('RGB')
try:
    for i in range(100):
        # Generate a random frame (replace with actual frame data as needed)
        image = np.array(pic)

        # Write the frame to ffmpeg's stdin
        process.stdin.write(image.tobytes())
        frames += 1
except Exception as e:
    logger.error(f"Error writing frames to ffmpeg: {e}")
finally:
    # Close ffmpeg's stdin to indicate no more data is coming
    process.stdin.close()
    # Wait for ffmpeg to finish processing
    process.wait()

elapsed = time.time() - start
logger.info("%d frames" % frames)
logger.info("%4.1f FPS, elapsed time: %4.2f seconds" % (frames / elapsed, elapsed))
