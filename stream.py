import asyncio
import websockets
import numpy as np
import subprocess
import sys

WIDTH = 1920
HEIGHT = 1080
FPS = 30

async def video_stream(websocket, path):
    # FFmpeg command to read raw RGB data and output H.264 encoded fragmented MP4
    ffmpeg_cmd = [
        './ffmpeg',  # Use './ffmpeg' to specify the executable in the current directory
        '-y',  # Overwrite output file if it exists (not needed here but kept for consistency)
        '-f', 'rawvideo',  # Input format is raw video
        '-pix_fmt', 'rgb24',        # Input pixel format
        '-framerate', '30',  # Input frame rate
        '-s', f'{WIDTH}x{HEIGHT}',  # Input resolution
        '-i', 'pipe:',  # Input comes from a pipe (stdin)
        '-vcodec', 'libx264',  # Video codec to use for encoding
        '-preset', 'ultrafast',  # Encoding speed/quality tradeoff
        # '-tune', 'zerolatency',  # Tune for low latency
        '-pix_fmt', 'nv21',  # Output pixel format (compatible with most players) yuv420p
        '-f', 'h264',  # Output format is raw H.264 bitstream
        "-bt","4M",
        "-b:a", "2M",
        "-pass","1",
        "-coder","0",
        "-bf","0",
        "-flags",
        "-loop",
        "-wpredp","0",
        "-an",
        'pipe:1'  # Output to stdout
    ]


    # Start the FFmpeg subprocess
    ffmpeg_process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    buffer = []
    from threading import Thread
    
    def reader():
        data_buffer = bytearray()
        while True:
            try:
                data = ffmpeg_process.stdout.read(1024)
                if not data:
                    break
                data_buffer.extend(data)
                # Parse data_buffer for NAL units
                while True:
                    # Look for the NAL unit start code (0x00000001 or 0x000001)
                    start_code_len = 0
                    if data_buffer.startswith(b'\x00\x00\x01'):
                        start_code_len = 3
                    elif data_buffer.startswith(b'\x00\x00\x00\x01'):
                        start_code_len = 4
                    else:
                        # Start code not at the beginning, find it
                        index = data_buffer.find(b'\x00\x00\x01')
                        if index == -1:
                            index = data_buffer.find(b'\x00\x00\x00\x01')
                        if index == -1:
                            # No start code found yet, keep the last 3 bytes
                            if len(data_buffer) > 3:
                                data_buffer = data_buffer[-3:]
                            break
                        else:
                            # Discard data before the start code
                            data_buffer = data_buffer[index:]
                            continue  # Check again for start code at the beginning

                    # Now we have a start code at the beginning
                    # Find the next start code
                    next_index = data_buffer.find(b'\x00\x00\x01', start_code_len)
                    next_index_alt = data_buffer.find(b'\x00\x00\x00\x01', start_code_len)
                    if next_index == -1 or (next_index_alt != -1 and next_index_alt < next_index):
                        next_index = next_index_alt
                    if next_index != -1:
                        # Extract NAL unit
                        nal_unit = data_buffer[:next_index]
                        buffer.append(nal_unit)
                        # Remove the extracted NAL unit from data_buffer
                        data_buffer = data_buffer[next_index:]
                    else:
                        # No complete NAL unit yet
                        # If data_buffer is too big, avoid memory issues
                        if len(data_buffer) > 1_000_000:
                            print("Data buffer too large, clearing buffer.")
                            data_buffer = bytearray()
                        break  # Wait for more data
            except Exception as e:
                print(f"Error reading ffmpeg stdout: {e}")
                break
            
            
    Thread(target=reader, daemon=True).start()
    import PIL.Image
    pic = PIL.Image.open('image.png')
    pic = pic.convert('RGB')

    try:
        while True:
            # Create a dummy frame (replace this with your actual frame data)
            frame = np.array(pic)
            print(f"frame generated")

            # Write the frame to FFmpeg stdin
            ffmpeg_process.stdin.write(frame.tobytes())
            if len(buffer) > 0:
                nal_unit = buffer.pop(0)
                
                await websocket.send(nal_unit)
                print(f"sent, reamining: {len(buffer)}")
                print(f"Sent NAL unit, remaining in buffer: {len(buffer)}")
            
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
