import asyncio
import websockets
import numpy as np
import subprocess
import mss
import mss.tools
from threading import Thread
import socket

def get_local_ip():
    try:
        # Use a dummy connection to find the local IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # You don't need to connect to a real server, just a dummy address
        s.connect(("8.8.8.8", 80))  # Google's DNS server
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        return str(e)

# Example usage:
local_ip = get_local_ip()
print("Local IP Address:", local_ip)


WIDTH = 1920
HEIGHT = 1080
FPS = 20

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
        '-g', '0.5',  # Set GOP size to 30
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-pix_fmt', 'yuv420p',  # Output pixel format (compatible with most players)
        '-f', 'mp4', 
        '-b:v', '40M',
        # '-pass', '1',
        # '-coder', '0',
        # '-bf', '0',
        # '-flags', '-loop',
        # '-wpredp', '0',
        '-an',  # No audio
        '-'
    ]

    # Start the FFmpeg subprocess
    ffmpeg_process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    buffer = []
    
    def reader():
        while True:
            try:
                data = ffmpeg_process.stdout.read(1024 * 16)
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
        data_idx = 0
        try:
            while True:
                # Capture the screen
                screenshot = sct.grab((0, 0, WIDTH/2, HEIGHT/2))
                
                # Convert the screenshot to a NumPy array and format it as RGB
                frame = np.array(screenshot)[:, :, :3]  # Ignore alpha channel if present
                
                frameCount += 1
                
                if len(buffer) < 1000:
                    ffmpeg_process.stdin.write(frame.tobytes())
                else:
                    print(f"Buffer full, skipping frame")

                msg = []
                # if len(buffer) > 0:
                #     data = buffer.pop(0)
                    #await websocket.send(data)
                while len(buffer) > 0 and len(msg) < 20:
                    data = buffer.pop(0)
                    print(f"Sending {data_idx}, remaining: {len(buffer)}")
                    data_idx += 1
                    await websocket.send(data)
                #     msg.append(data)
                # if len(msg) > 0:
                #     msg= b''.join(msg)
                #     await websocket.send(msg)
                while len(buffer) > 10000:
                    buffer.pop(0)
                
        except Exception as e:
            print(f"Error generating frames: {e}")
        finally:
            ffmpeg_process.stdin.close()
            ffmpeg_process.stdout.close()
            ffmpeg_process.wait()

# Start the WebSocket server
start_server = websockets.serve(video_stream, local_ip, 8765)

# Run the server until interrupted
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
