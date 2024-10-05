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
        './ffmpeg',
        '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-pix_fmt', 'rgb24',
        '-s', f'{WIDTH}x{HEIGHT}',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        'pipe:1'
    ]

    # Start the FFmpeg subprocess
    ffmpeg_process = subprocess.Popen(
        ffmpeg_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL  # Suppress FFmpeg output
    )

    async def send_video():
        try:
            while True:
                data = ffmpeg_process.stdout.read(4096)
                print(f"encoded data")
                if not data:
                    break
                await websocket.send(data)
        except Exception as e:
            print(f"Error sending video: {e}")

    # Start sending video data asynchronously
    send_task = asyncio.create_task(send_video())

    try:
        while True:
            # Create a dummy frame (replace this with your actual frame data)
            frame = np.random.randint(0, 255, (HEIGHT, WIDTH, 3), dtype=np.uint8)
            print(f"frame generated")

            # Write the frame to FFmpeg stdin
            ffmpeg_process.stdin.write(frame.tobytes())
            ffmpeg_process.stdin.flush()

            # Maintain the frame rate
            import time
            time.sleep(1 / FPS)
    except Exception as e:
        print(f"Error generating frames: {e}")
    finally:
        ffmpeg_process.stdin.close()
        await send_task
        ffmpeg_process.stdout.close()
        ffmpeg_process.wait()

# Start the WebSocket server
start_server = websockets.serve(video_stream, 'localhost', 8765)

# Run the server until interrupted
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
