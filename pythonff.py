import logging
import sys
import time
import numpy as np
import subprocess

# Set up logging
logger = logging.getLogger("Writer")
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s %(levelname)-8s %(module)s %(message)s")
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Define width and height
W = 1920
H = 1080

# Define the ffmpeg command to output to stdout (pipe:1)
ffmpeg_cmd = [
    './ffmpeg',  # Use './ffmpeg' to specify the executable in the current directory
    '-y',  # Overwrite output file if it exists (not needed here but kept for consistency)
    '-f', 'rawvideo',  # Input format is raw video
    '-framerate', '30',  # Input frame rate
    '-pix_fmt', 'bgr24',  # Input pixel format
    '-s', f'{W}x{H}',  # Input resolution
    '-i', 'pipe:',  # Input comes from a pipe (stdin)
    '-vcodec', 'libx264',  # Video codec to use for encoding
    '-preset', 'ultrafast',  # Encoding speed/quality tradeoff
    '-tune', 'zerolatency',  # Tune for low latency
    '-pix_fmt', 'yuv420p',  # Output pixel format (compatible with most players)
    '-f', 'h264',  # Output format is raw H.264 bitstream
    'pipe:1'  # Output to stdout
]

# Start the ffmpeg process with stdout piped
process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

frames = 0
start = time.time()

def reader():
    while True:
        data = process.stdout.read(1024)
        if not data:
            break
        print(data.hex())

try:
    from threading import Thread
    # Generate and write frames to ffmpeg stdin
    Thread(target=reader, daemon=True).start()
    for i in range(10):
        # Generate a random image (replace with your actual frame data)
        image = np.random.randint(0, 255, (H, W, 3), dtype=np.uint8)
        # Write the image data to ffmpeg's stdin
        process.stdin.write(image.tobytes())
        frames += 1

    # Close ffmpeg's stdin to signal that no more data will be sent
    process.stdin.close()

    # # Read ffmpeg's stdout and print the encoded data
    # while True:
    #     # Read encoded data from ffmpeg's stdout
    #     data = process.stdout.read(1024)
    #     if not data:
    #         break
    #     # Print the encoded data (as hex for readability, or handle as needed)
    #     print(data.hex())

    # Wait for ffmpeg process to finish
    process.wait()

    # Optionally, read and log any errors from ffmpeg's stderr
    stderr_output = process.stderr.read().decode()
    if stderr_output:
        logger.error(f"FFmpeg stderr: {stderr_output}")

except Exception as e:
    logger.error(f"An error occurred: {e}")

elapsed = time.time() - start
logger.info("%d frames" % frames)
logger.info("%4.1f FPS, elapsed time: %4.2f seconds" % (frames / elapsed, elapsed))
