"""Check recovered pixels, rather than just the old dark-only audience mask."""

import cv2
import imageio_ffmpeg
import numpy as np

from blue_stage import ROOT, OUTPUT, grade
from restore_lit_hands import NAME, SIZE, recovery_mask


def main():
    readers = [imageio_ffmpeg.read_frames(str(path),pix_fmt='rgb24') for path in (
        ROOT/'frontend/public/hero-video.mp4',OUTPUT/'blue-smooth-javascript.mp4',OUTPUT/f'{NAME}.mp4')]
    metadata = [next(reader) for reader in readers]
    assert metadata[1]['size']==metadata[2]['size']==SIZE
    assert metadata[2]['fps']==24 and metadata[2]['codec']=='h264'
    checked,total_before,total_after,total_pixels,worst = 0,0,0,0,0
    try:
        for index,raws in enumerate(zip(*readers,strict=True)):
            source = np.frombuffer(raws[0],dtype='uint8').reshape(720,1280,3)
            before,after = [np.frombuffer(raw,dtype='uint8').reshape(1440,2560,3) for raw in raws[1:]]
            old,matte = recovery_mask(source)
            old_hd = cv2.resize(old,SIZE,interpolation=cv2.INTER_LINEAR)
            matte_hd = cv2.resize(matte,SIZE,interpolation=cv2.INTER_LINEAR)
            recovered = (matte_hd==1)&(old_hd<.9)
            assert recovered.sum()>500
            expected = np.clip(cv2.resize(grade(source[:,::-1],'blue'),SIZE,interpolation=cv2.INTER_CUBIC)*255,0,255).astype('uint8')
            before_error = np.abs(before.astype('int16')-expected.astype('int16'))[recovered]
            after_error = np.abs(after.astype('int16')-expected.astype('int16'))[recovered]
            mean = float(after_error.mean())
            # These are narrow lit edges, where H.264 4:2:0 chroma sampling
            # introduces more RGB error than on the old broad dark interiors.
            # Bound that codec error and reject genuinely missing silhouettes.
            assert mean<6,(index,mean)
            assert float((after_error.max(axis=1)>40).mean())<.001
            # The title above the audience remains the saved baseline, with
            # only normal second-generation codec differences.
            unchanged = (matte_hd[710:870,850:1740]-old_hd[710:870,850:1740])<.0001
            unchanged = cv2.erode(unchanged.astype('uint8'),np.ones((9,9),dtype='uint8'))>0
            sign_error = np.abs(after[710:870,850:1740].astype('int16')-before[710:870,850:1740].astype('int16'))
            # At least 35 dB PSNR on the unchanged sign region: allow codec
            # quantization without accepting a shifted or damaged letter edge.
            sign_rmse = float(np.sqrt(np.mean(sign_error[unchanged].astype('float32')**2)))
            assert sign_rmse<4.5,(index,sign_rmse)
            total_before+=int(before_error.sum());total_after+=int(after_error.sum())
            total_pixels+=after_error.size;worst=max(worst,mean);checked+=1
            if index%120==0:print(f'Frame {index}: {recovered.sum()} previously excluded foreground pixels checked',flush=True)
    finally:
        for reader in readers:reader.close()
    assert checked==430
    assert total_after<total_before*.7,(total_before,total_after)
    print(f'Passed {checked} frames; recovered-hand error {total_before/total_pixels:.3f} -> {total_after/total_pixels:.3f}/255; worst frame {worst:.3f}/255',flush=True)


if __name__=='__main__':main()
