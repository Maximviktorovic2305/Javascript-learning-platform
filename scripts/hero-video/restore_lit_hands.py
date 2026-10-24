"""Recover illuminated audience details over the preserved smooth-sign movie.

Only an additional foreground layer is patched: no lettering or camera geometry
is re-rendered. Limit highlight recovery to the existing audience's vicinity so
the lighter, separate stage performer is not brought back with the crowd.
"""

import argparse

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

from blue_stage import ROOT, OUTPUT, foreground_matte, grade

NAME = 'blue-full-hands-javascript'
SIZE = (2560,1440)


def recovery_mask(source):
    old = foreground_matte(source,tight=True)
    core = (old>=.999).astype('uint8')
    value = source.max(axis=2)
    # Reconnect illuminated fingers, palms and narrow wrists. A global higher
    # brightness cutoff would also connect the musician and stage haze.
    backdrop = cv2.morphologyEx(value,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(31,31)))
    contrast = backdrop.astype('float32')-value.astype('float32')
    silhouette = np.clip((contrast-12)/36,0,1)
    y,x = np.mgrid[:720,:1280]
    band = np.minimum.reduce([
        np.clip((y-370)/25,0,1),np.clip((565-y)/25,0,1),
        np.clip((x-345)/35,0,1),np.clip((950-x)/35,0,1),
    ]).astype('float32')
    # Keep the removed stage performer's moving arms/head and central torso
    # out of the additional layer. Existing audience pixels are never removed.
    upper_performer = np.clip(np.minimum.reduce([(x-548)/12,(738-x)/12,(455-y)/12]),0,1)
    torso = np.clip(np.minimum.reduce([(x-609)/10,(676-x)/10,(490-y)/10]),0,1)
    performer = np.maximum(upper_performer,torso)
    # A bright wrist can disconnect a whole small dark palm from the bottom
    # component. Seed those local silhouettes directly instead of discarding
    # them merely because they have no dark path to the frame's bottom edge.
    detached = (value<135)&(y>455)&(band>0)&(performer==0)
    seeds = np.maximum(core,detached.astype('uint8'))
    distance = cv2.distanceTransform(1-seeds,cv2.DIST_L2,5)
    reach = np.clip((8-distance)/2,0,1)
    recovered = silhouette*reach*(1-performer)
    matte = np.maximum(old,recovered*band)
    return old[:,::-1],matte[:,::-1]


def repair(source,base):
    old,matte = recovery_mask(source)
    increment = np.divide(matte-old,1-old,out=np.zeros_like(old),where=old<.999)
    extra = cv2.resize(increment,SIZE,interpolation=cv2.INTER_LINEAR)
    matte_hd = cv2.resize(matte,SIZE,interpolation=cv2.INTER_LINEAR)
    source_hd = np.clip(cv2.resize(grade(source[:,::-1],'blue'),SIZE,interpolation=cv2.INTER_CUBIC),0,1)
    # This is an incremental recovery over already matted footage. Applying
    # background subtraction again would outline fingers with a dark stroke.
    composed = source_hd*extra[:,:,None]+base.astype('float32')/255*(1-extra[:,:,None])
    result = base.copy()
    changed = extra>0
    result[changed] = np.clip(composed[changed]*255,0,255).astype('uint8')
    dense = (matte_hd==1)&(extra==1)
    expected = (source_hd*255).astype('uint8')
    assert dense.sum()>2000
    assert np.abs(result[dense].astype('int16')-expected[dense].astype('int16')).max()<=1
    assert np.array_equal(result[~changed],base[~changed])
    return result,int(dense.sum())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview',action='store_true')
    args = parser.parse_args()
    source_reader = imageio_ffmpeg.read_frames(str(ROOT/'frontend/public/hero-video.mp4'),pix_fmt='rgb24')
    base_reader = imageio_ffmpeg.read_frames(str(OUTPUT/'blue-smooth-javascript.mp4'),pix_fmt='rgb24')
    source_meta,base_meta = next(source_reader),next(base_reader)
    assert source_meta['size']==(1280,720) and base_meta['size']==SIZE
    writer = None
    if not args.preview:
        writer = imageio_ffmpeg.write_frames(str(OUTPUT/f'{NAME}.mp4'),SIZE,fps=24,codec='libx264',
            output_params=['-crf','14','-preset','medium','-movflags','+faststart','-an'],macro_block_size=1)
        writer.send(None)
    checked = 0
    try:
        for index,(source_raw,base_raw) in enumerate(zip(source_reader,base_reader,strict=True)):
            if args.preview and index not in (0,96,192,288,384):continue
            source = np.frombuffer(source_raw,dtype='uint8').reshape(720,1280,3)
            base = np.frombuffer(base_raw,dtype='uint8').reshape(1440,2560,3)
            result,count = repair(source,base)
            if args.preview:Image.fromarray(result).save(ROOT/f'.local/full-hands-preview-{index}.png')
            elif index==0:Image.fromarray(result).save(OUTPUT/f'{NAME}.webp',quality=95)
            if writer:writer.send(result.tobytes())
            checked+=1
            if index%48==0:print(f'Frame {index}: {count} newly protected audience pixels',flush=True)
    finally:
        source_reader.close();base_reader.close()
        if writer:writer.close()
    assert checked==(5 if args.preview else 430)
    print(f'Finished {checked} frames; smooth-sign base retained unchanged',flush=True)


if __name__=='__main__':
    main()
