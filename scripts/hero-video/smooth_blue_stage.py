"""Rebuild the selected blue sign from geometry, without re-encoding old letters.

The sign is rendered at 3840x2160 with 4-sample MSAA, then area-resolved into
a 2560x1440 video. The original camera, sign pose, colors and timing remain.
The reference footage itself has 1280x720 detail; only the lettering is new HD
geometry. Audience silhouettes are composited last with decontaminated edges.
"""

import argparse
import math

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

from blue_stage import ROOT, OUTPUT, W, H, Sign, edit, grade, foreground_matte, composite_clean_edges

SIZE = (W*2,H*2)
NAME = 'blue-smooth-javascript'


class EmptySign:
    style = 'blue'

    def render(self, phase):
        return np.zeros((H,W,4),dtype='float32')


def compose(source,sign,phase):
    background = edit(source,EmptySign(),phase).astype('float32')/255
    background = cv2.resize(background,SIZE,interpolation=cv2.INTER_CUBIC)
    # Multisample RGB is already premultiplied by coverage. Resolve all four
    # channels together and never multiply RGB by alpha a second time.
    letters = cv2.resize(sign.render(phase),SIZE,interpolation=cv2.INTER_AREA)
    matte = cv2.resize(foreground_matte(source,tight=True)[:,::-1],SIZE,interpolation=cv2.INTER_LINEAR)
    source_blue = np.clip(cv2.resize(grade(source[:,::-1],'blue'),SIZE,interpolation=cv2.INTER_CUBIC),0,1)
    glow = cv2.GaussianBlur(letters[:,:,:3],(0,0),18)*.17
    background = np.clip(background+glow,0,1)
    edited = letters[:,:,:3]+background*(1-letters[:,:,3:4])
    result = composite_clean_edges(source_blue,edited,matte,np.ones_like(matte))
    protected = matte==1
    assert protected.sum()>100000
    assert np.max(np.abs(result[protected]-source_blue[protected]))<1e-5
    return np.clip(result*255,0,255).astype('uint8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview',action='store_true')
    args = parser.parse_args()
    sign = Sign('C:/Windows/Fonts/arialbd.ttf',render_scale=3)
    reader = imageio_ffmpeg.read_frames(str(ROOT/'frontend/public/hero-video.mp4'),pix_fmt='rgb24')
    meta = next(reader)
    assert meta['size']==(W,H) and meta['fps']==24
    writer = None
    if not args.preview:
        writer = imageio_ffmpeg.write_frames(str(OUTPUT/f'{NAME}.mp4'),SIZE,fps=24,codec='libx264',
            output_params=['-crf','16','-preset','medium','-movflags','+faststart','-an'],macro_block_size=1)
        writer.send(None)
    checked = 0
    try:
        for index,raw in enumerate(reader):
            if args.preview and index not in (0,96,192,288,384): continue
            source = np.frombuffer(raw,dtype='uint8').reshape(H,W,3)
            result = compose(source,sign,math.tau*index/430)
            if args.preview:
                Image.fromarray(result).save(ROOT/f'.local/blue-smooth-preview-{index}.png')
            elif index==0:
                Image.fromarray(result).save(OUTPUT/f'{NAME}.webp',quality=95)
            if writer: writer.send(result.tobytes())
            checked+=1
            if index%48==0: print(f'Frame {index}/430: supersampled lettering, original hands protected',flush=True)
    finally:
        reader.close()
        if writer: writer.close()
    assert checked==(5 if args.preview else 430)
    print(f'Finished {checked} frames at {SIZE[0]}x{SIZE[1]}',flush=True)


if __name__=='__main__':
    main()
