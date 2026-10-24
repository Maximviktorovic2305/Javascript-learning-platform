"""Decode the complete HD movie and verify original foreground preservation."""

import cv2
import imageio_ffmpeg
import numpy as np

from blue_stage import ROOT, OUTPUT, foreground_matte, grade


def main():
    path = OUTPUT/'blue-smooth-javascript.mp4'
    source_reader = imageio_ffmpeg.read_frames(str(ROOT/'frontend/public/hero-video.mp4'),pix_fmt='rgb24')
    target_reader = imageio_ffmpeg.read_frames(str(path),pix_fmt='rgb24')
    source_meta,target_meta = next(source_reader),next(target_reader)
    assert source_meta['size']==(1280,720)
    assert target_meta['size']==(2560,1440) and target_meta['fps']==24
    assert target_meta['codec']=='h264'
    checked,worst_mean,worst_lost = 0,0,0
    try:
        for index,(source_raw,target_raw) in enumerate(zip(source_reader,target_reader,strict=True)):
            source = np.frombuffer(source_raw,dtype='uint8').reshape(720,1280,3)
            target = np.frombuffer(target_raw,dtype='uint8').reshape(1440,2560,3)
            matte = cv2.resize(foreground_matte(source,tight=True)[:,::-1],(2560,1440),interpolation=cv2.INTER_LINEAR)
            protected = matte==1
            protected[:500] = False
            protected[1100:] = False
            assert protected.sum()>50000
            expected = np.clip(cv2.resize(grade(source[:,::-1],'blue'),(2560,1440),interpolation=cv2.INTER_CUBIC)*255,0,255).astype('uint8')
            error = np.abs(target.astype('int16')-expected.astype('int16'))[protected]
            mean,lost = float(error.mean()),float((error.max(axis=1)>40).mean())
            worst_mean,worst_lost = max(worst_mean,mean),max(worst_lost,lost)
            assert mean<3 and lost<.0005,(index,mean,lost)
            checked+=1
            if index%120==0: print(f'Decoded frame {index}: original hands preserved',flush=True)
    finally:
        source_reader.close()
        target_reader.close()
    assert checked==430
    # MP4 box order must permit playback before the full movie downloads.
    boxes = []
    with path.open('rb') as movie:
        while header:=movie.read(8):
            size=int.from_bytes(header[:4],'big')
            kind=header[4:]
            if size==1:
                size=int.from_bytes(movie.read(8),'big')
                movie.seek(size-16,1)
            elif size>=8:
                movie.seek(size-8,1)
            else:
                break
            boxes.append(kind)
    assert boxes.index(b'moov')<boxes.index(b'mdat')
    print(f'Passed: {checked} frames, 2560x1440 H.264/24fps/faststart; worst hand error {worst_mean:.3f}/255; fraction >40: {worst_lost:.6f}',flush=True)


if __name__=='__main__':
    main()
