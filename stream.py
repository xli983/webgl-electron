import asyncio
import websockets
import numpy as np
import subprocess
import sys

WIDTH = 1920
HEIGHT = 1080
FPS = 30
import base64
async def video_stream(websocket, path):
    # FFmpeg command to read raw RGB data and output H.264 encoded fragmented MP4
    ffmpeg_cmd = [
        './ffmpeg',  # Use './ffmpeg' to specify the executable in the current directory
        '-y',  # Overwrite output file if it exists (not needed here but kept for consistency)
        '-f', 'rawvideo',  # Input format is raw video
        '-pix_fmt', 'rgb24',        # Input pixel format
        '-framerate', '20',  # Input frame rate
        '-s', f'{WIDTH}x{HEIGHT}',  # Input resolution
        '-i', 'pipe:',  # Input comes from a pipe (stdin)
        '-vcodec', 'libx264',  # Video codec to use for encoding
        '-preset', 'ultrafast',  # Encoding speed/quality tradeoff
        '-tune', 'zerolatency',  # Tune for low latency
        '-g', '30',              # Set GOP size to 30
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        # '-pix_fmt', 'yuv420p',  # Output pixel format (compatible with most players) yuv420p
        '-f', 'mp4',  # Output format is raw H.264 bitstream
        #'-f', 'mpegts',  # Use MPEG-TS format

        "-bt","4M",
        "-b:a", "2M",
        "-pass","1",
        "-coder","0",
        "-bf","0",
        "-flags",
        "-loop",
        "-wpredp","0",

        "-an",
        "-"
        #'pipe:1'  # Output to stdout
    ]

    # ffmpeg_cmd = ["./ffmpeg","-y", "-framerate", "30",
    # '-f', 'rawvideo',           # Input format
    # '-pix_fmt', 'rgb24',        # Input pixel format
    # '-s', f'{WIDTH}x{HEIGHT}',           # Input resolution 
    # "-i", "pipe:", "-vcodec", "libx264", 
    # '-movflags', 'frag_keyframe+empty_moov+default_base_moof',  # For fragmented MP4
    # "-b:a", "2M", "-bt", "4M", "-pass", "1", "-coder", "0", "-bf", "0", "-flags", "-loop", "-wpredp", "0", "-an", "-f", "mp4", "-" ]

    # Start the FFmpeg subprocess
    ffmpeg_process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    buffer = []
    from threading import Thread
    
    def reader():
        while True:
            try:
                data = ffmpeg_process.stdout.read(4096*32)
                print(f"read {len(data)}")
                #data = base64.b64encode(data)
                if not data:
                    break
                buffer.append(data)
                continue
            except Exception as e:
                print(f"Error reading ffmpeg stdout: {e}")
                break
            
            
    Thread(target=reader, daemon=True).start()
    import PIL.Image
    pic = PIL.Image.open('image.png')
    pic = pic.convert('RGB')
    frameCount = 0
    try:
        while True:
            # Create a dummy frame (replace this with your actual frame data)
            #frame = np.random.randint(0, 255, (HEIGHT, WIDTH, 3), dtype=np.uint8)
            if frameCount % 10 < 5:
                frame = 255 -np.array(pic)
                print(f"zero frame")
            else:
                frame = np.array(pic)
                print(f"pic frame")
            frame[:200, :200] = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
            frameCount += 1
            # Write the frame to FFmpeg stdin
            #if generate:
            if len(buffer) <1000:
                ffmpeg_process.stdin.write(frame.tobytes())
            else:
                print(f"buffer full, skip")
                #generate = False
            if len(buffer) > 0:
                nal_unit = buffer.pop(0)
                
                await websocket.send(nal_unit)
                generate = True
                print(f"sent, reamining: {len(buffer)}")
                print(f"Sent NAL unit, remaining in buffer: {len(buffer)}")
            # else:
            #     ffmpeg_process.stdin.write(frame.tobytes())
            
            while len(buffer) > 10000:
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
