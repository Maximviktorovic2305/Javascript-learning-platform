"""Repair foreground hands directly over the existing port-3025 video.

Uses blue-javascript.mp4 as the actual base, retaining its lettering, motion,
lighting and composition. Only the audience silhouettes in the interaction
band are patched from the graded original. Previous videos are not overwritten.
"""

import argparse

import imageio_ffmpeg
import numpy as np
from PIL import Image

from blue_stage import ROOT, OUTPUT, foreground_matte, grade, composite_clean_edges


def repair_hands(source, base):
    matte = foreground_matte(source,tight=True)[:,::-1]
    y = np.arange(720,dtype='float32')[:,None]
    # The old sign and performer repair intersect the crowd in this band.
    # Feather the band's ends so no unrelated area of the source movie changes.
    band = np.minimum(np.clip((y-290)/20,0,1),np.clip((550-y)/20,0,1))
    coverage = matte*band
    source_blue = grade(source[:,::-1],'blue')
    edited = composite_clean_edges(source_blue,base.astype('float32')/255,matte,np.ones_like(matte))
    blended = edited*band[:,:,None]+base.astype('float32')/255*(1-band[:,:,None])
    result = base.copy()
    affected = coverage>0
    result[affected] = np.clip(blended[affected]*255,0,255).astype('uint8')
    # Dense hands receive original foreground colors; the base is untouched
    # everywhere outside the actual silhouette and repair band.
    protected = coverage>=.999
    expected = (source_blue*255).astype('uint8')
    assert np.abs(result[protected].astype('int16')-expected[protected].astype('int16')).max()<=1
    assert np.array_equal(result[~affected],base[~affected])
    return result,int(protected.sum())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview',action='store_true')
    args = parser.parse_args()
    original = imageio_ffmpeg.read_frames(str(ROOT/'frontend/public/hero-video.mp4'),pix_fmt='rgb24')
    baseline = imageio_ffmpeg.read_frames(str(OUTPUT/'blue-javascript.mp4'),pix_fmt='rgb24')
    source_meta,base_meta = next(original),next(baseline)
    assert source_meta['size']==base_meta['size']==(1280,720)
    assert source_meta['fps']==base_meta['fps']==24
    writer = None
    if not args.preview:
        writer = imageio_ffmpeg.write_frames(str(OUTPUT/'blue-preserved-javascript.mp4'),(1280,720),fps=24,codec='libx264',
            output_params=['-crf','16','-preset','medium','-movflags','+faststart','-an'],macro_block_size=1)
        writer.send(None)
    samples = {0,96,192,288,384}
    checked = 0
    try:
        for index,(source_raw,base_raw) in enumerate(zip(original,baseline,strict=True)):
            if args.preview and index not in samples: continue
            source = np.frombuffer(source_raw,dtype='uint8').reshape(720,1280,3)
            base = np.frombuffer(base_raw,dtype='uint8').reshape(720,1280,3)
            result,protected = repair_hands(source,base)
            assert protected>20000
            if args.preview:
                Image.fromarray(result).save(ROOT/f'.local/blue-preserved-preview-{index}.png')
            elif index==0:
                Image.fromarray(result).save(OUTPUT/'blue-preserved-javascript.webp',quality=91)
            if writer: writer.send(result.tobytes())
            checked+=1
            if index%96==0: print(f'Frame {index}: {protected} source hand pixels protected; rest of base unchanged',flush=True)
    finally:
        original.close()
        baseline.close()
        if writer: writer.close()
    assert checked==(5 if args.preview else 430)
    print(f'Finished: {checked} frames checked against the actual 3025 base',flush=True)


if __name__=='__main__':
    main()
