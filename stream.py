import asyncio
import websockets
import numpy as np
import subprocess
import sys

WIDTH = 640
HEIGHT = 480
FPS = 30

async def video_stream(websocket, path):
    # FFmpeg command to read raw RGB data and output H.264 encoded fragmented MP4
    ffmpeg_cmd = [
        './ffmpeg',  # Use './ffmpeg' to specify the executable in the current directory
        '-y',  # Overwrite output file if it exists (not needed here but kept for consistency)
        '-f', 'rawvideo',  # Input format is raw video
        '-framerate', '30',  # Input frame rate
        '-s', f'{WIDTH}x{HEIGHT}',  # Input resolution
        '-i', 'pipe:',  # Input comes from a pipe (stdin)
        '-vcodec', 'libx264',  # Video codec to use for encoding
        '-preset', 'ultrafast',  # Encoding speed/quality tradeoff
        '-tune', 'zerolatency',  # Tune for low latency
        '-pix_fmt', 'bgr24',  # Output pixel format (compatible with most players) yuv420p
        '-f', 'h264',  # Output format is raw H.264 bitstream
        'pipe:1'  # Output to stdout
    ]


    # Start the FFmpeg subprocess
    ffmpeg_process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    buffer = []
    from threading import Thread
    def reader():
        while True:
            try:
                data = ffmpeg_process.stdout.read(4096*4)
                if not data:
                    break
                buffer.append(data)
            except Exception as e:
                print(f"Error reading ffmpeg stdout: {e}")
            
    Thread(target=reader, daemon=True).start()


    try:
        while True:
            # Create a dummy frame (replace this with your actual frame data)
            frame = np.random.randint(0, 255, (HEIGHT, WIDTH, 3), dtype=np.uint8)
            print(f"frame generated")

            # Write the frame to FFmpeg stdin
            ffmpeg_process.stdin.write(frame.tobytes())
            if len(buffer) > 0:
                await websocket.send(buffer.pop(0))
                print(f"sent, reamining: {len(buffer)}")
            
            while len(buffer) > 100:
                buffer.pop(0)
            #ffmpeg_process.stdin.flush()

            # Maintain the frame rate
            import time
            time.sleep(1 / FPS)
    except Exception as e:
        print(f"Error generating frames: {e}")
    finally:
        ffmpeg_process.stdin.close()
        ffmpeg_process.stdout.close()
        ffmpeg_process.wait()

# Start the WebSocket server
start_server = websockets.serve(video_stream, 'localhost', 8765)

# Run the server until interrupted
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
