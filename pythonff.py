import logging, sys, time, cv2, ffmpeg, numpy
import numpy as np
import os
os.environ["PATH"] += os.pathsep + './'
logger = logging.getLogger("Writer")
logger.setLevel("INFO")
formatter = logging.Formatter("%(asctime)s %(levelname)-8s %(module)s %(message)s")
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(formatter)
logger.addHandler(handler)
videoCapture = cv2.VideoCapture('/home/servadmin/Downloads/motion-11-55-41.avi')
W = 1920
H = 1080
process = (
    ffmpeg
    .input('pipe:', framerate='30', format='rawvideo', pix_fmt='bgr24', s='{}x{}'.format(W, H))
    .output('out.mp4', vcodec='libx264', pix_fmt='nv21', **{'b:v': 2000000})
    .overwrite_output()
    .run_async(pipe_stdin=True)
)
lastFrame = False
frames = 0
start = time.time()
for i in range(100):
    image = np.random.randint(0, 255, (H, W, 3), dtype=np.uint8)
    process.stdin.write(
        image
        .astype(numpy.uint8)
        .tobytes()
    )        
    frames += 1
elapsed = time.time() - start
logger.info("%d frames" % frames)
logger.info("%4.1f FPS, elapsed time: %4.2f seconds" % (frames / elapsed, elapsed))
del videoCapture