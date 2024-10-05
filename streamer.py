import asyncio
import websockets
import numpy as np
import subprocess
import mss
import mss.tools
from threading import Thread
import time

WIDTH = 2560
HEIGHT = 1440
FPS = 30

async def video_stream(websocket, path):
    # FFmpeg command to read raw RGB data and output H.264 encoded fragmented MP4
    ffmpeg_cmd = [
        './ffmpeg',  # Use './ffmpeg' to specify the executable in the current directory
        '-y',  # Overwrite output file if it exists (not needed here but kept for consistency)
        '-f', 'rawvideo',  # Input format is raw video
        '-pix_fmt', 'rgb24',  # Input pixel format
        '-framerate', str(FPS),  # Input frame rate
        '-s', f'{WIDTH}x{HEIGHT}',  # Input resolution
        '-i', 'pipe:',  # Input comes from a pipe (stdin)
        '-vcodec', 'libx264',  # Video codec to use for encoding
        '-preset', 'ultrafast',  # Encoding speed/quality tradeoff
        '-tune', 'zerolatency',  # Tune for low latency
        '-g', '0.1',  # Set GOP size to 30
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-pix_fmt', 'yuv420p',  # Output pixel format (compatible with most players)
        '-f', 'mp4',  # Output format is raw H.264 bitstream
        '-bt', '0.05M',
        '-pass', '1',
        '-coder', '0',
        '-bf', '0',
        '-flags', '-loop',
        '-wpredp', '0',
        '-an',  # No audio
        '-'
    ]

    # Start the FFmpeg subprocess
    ffmpeg_process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    buffer = []
    
    def reader():
        while True:
            try:
                data = ffmpeg_process.stdout.read(4096 * 8)
                if not data:
                    break
                buffer.append(data)
            except Exception as e:
                print(f"Error reading ffmpeg stdout: {e}")
                break

    Thread(target=reader, daemon=True).start()

    # Initialize mss for screen capture
    with mss.mss() as sct:
        frameCount = 0
        monitor = {"top": 0, "left": 0, "width": WIDTH, "height": HEIGHT}

        try:
            while True:
                # Capture the screen
                screenshot = sct.grab((0, 0, WIDTH/2, HEIGHT/2))
                
                # Convert the screenshot to a NumPy array and format it as RGB
                frame = np.array(screenshot)[:, :, :3]  # Ignore alpha channel if present
                
                frameCount += 1
                #frame[:200, :200] = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
                
                if len(buffer) < 1000:
                    ffmpeg_process.stdin.write(frame.tobytes())
                else:
                    print(f"Buffer full, skipping frame")

                print(f"Sending, remaining: {len(buffer)}")
                while len(buffer) > 0:
                    nal_unit = buffer.pop(0)
                    await websocket.send(nal_unit)

                while len(buffer) > 10000:
                    buffer.pop(0)
                
                #current_time = await websocket.recv()
                #print(f"Received: {current_time}")
                # Maintain the frame rate
                #time.sleep(1 / FPS)
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
