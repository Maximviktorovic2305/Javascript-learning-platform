"""Check that scene repair and lettering do not erase original audience pixels.

Run with the video rendering environment; needs the preserved source footage.
"""

import argparse
from types import SimpleNamespace

import imageio_ffmpeg
import numpy as np

from blue_stage import ROOT, Sign, edit, foreground_matte, grade, composite_clean_edges


def check_edge_colors():
    alpha = np.zeros((16,64),dtype='float32')
    alpha[:,16:48] = 1
    alpha[:,15],alpha[:,48] = .75,.25
    backdrop = np.array([.1,.35,.8],dtype='float32')
    hand = np.array([.012,.018,.025],dtype='float32')
    target = np.array([.8,.9,1],dtype='float32')
    source = hand*alpha[:,:,None]+backdrop*(1-alpha[:,:,None])
    edited = np.broadcast_to(target,source.shape).copy()
    result = composite_clean_edges(source,edited,alpha,np.ones_like(alpha))
    expected = hand*alpha[:,:,None]+target*(1-alpha[:,:,None])
    assert np.abs(result-expected).max()<1e-6, 'Original backdrop leaked into hand edges'
    print('Synthetic antialiased silhouette: source background removed from edge colors')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--font', default='C:/Windows/Fonts/arialbd.ttf')
    parser.add_argument('--style', choices=['blue-large','blue-refined'], default='blue-refined')
    args = parser.parse_args()
    check_edge_colors()
    sign = Sign(args.font, args.style)
    plain = SimpleNamespace(style='blue-clean')
    reader = imageio_ffmpeg.read_frames(str(ROOT/'frontend/public/hero-video.mp4'), pix_fmt='rgb24')
    metadata = next(reader)
    samples = {0, 96, 192, 288, 384}
    checked = 0
    try:
        for index, raw in enumerate(reader):
            if index not in samples:
                continue
            frame = np.frombuffer(raw, dtype='uint8').reshape(720,1280,3)
            mask = foreground_matte(frame,tight=args.style=='blue-refined')[:,::-1] >= .999
            mask[:200] = False
            assert mask.sum() > 100000, f'Lost audience mask at frame {index}'
            expected = (grade(frame[:,::-1], 'blue-large')*255).astype('uint8')
            for name, renderer in [('with text',sign), ('without text',plain)]:
                output = edit(frame, renderer, index/430*np.pi*2)
                error = np.abs(output.astype('int16')-expected.astype('int16'))
                largest = int(error[mask].max())
                assert largest <= 1, f'Foreground overwritten: frame={index}, {name}, error={largest}'
            checked += 1
            print(f'Frame {index}: original audience preserved with and without text ({mask.sum()} pixels)')
    finally:
        reader.close()
    assert checked == len(samples)


if __name__ == '__main__':
    main()
