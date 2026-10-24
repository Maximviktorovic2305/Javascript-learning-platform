"""Mirror and grade the preserved concert footage, replacing its center performer.

The JavaScript sign is a genuine extruded font mesh rendered with OpenGL.
The output remains a derivative of the reference footage, not new footage.
"""

import argparse
import math
from pathlib import Path

import cv2
import imageio_ffmpeg
import mapbox_earcut
import moderngl
import numpy as np
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from PIL import Image
from shapely.geometry import Point, Polygon

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'frontend/public/hero-variants'
W, H = 1280, 720


class OutlinePen(BasePen):
    def __init__(self, glyphs):
        super().__init__(glyphs)
        self.rings = []
        self.points = []

    def _moveTo(self, point):
        self.points = [point]

    def _lineTo(self, point):
        self.points.append(point)

    def _qCurveToOne(self, control, end):
        start = self.points[-1]
        for t in np.linspace(0,1,49)[1:]:
            self.points.append(tuple((1-t)**2*np.array(start)+2*(1-t)*t*np.array(control)+t*t*np.array(end)))

    def _curveToOne(self, a, b, end):
        start = self.points[-1]
        for t in np.linspace(0,1,65)[1:]:
            self.points.append(tuple((1-t)**3*np.array(start)+3*(1-t)**2*t*np.array(a)+3*(1-t)*t*t*np.array(b)+t**3*np.array(end)))

    def _closePath(self):
        if len(self.points)>2:
            self.rings.append(self.points)
        self.points = []

    _endPath = _closePath


def text_mesh(font_path, grounded=False):
    font = TTFont(font_path)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    units = font['head'].unitsPerEm
    cursor, polygons = 0, []
    for char in 'JavaScript':
        name = cmap[ord(char)]
        pen = OutlinePen(glyphs)
        glyphs[name].draw(pen)
        rings = [np.array(points,dtype='f8')/units+[cursor,0] for points in pen.rings]
        if grounded:
            bottom = min(ring[:,1].min() for ring in rings)
            for ring in rings: ring[:,1] -= bottom
        shells = [Polygon(points).buffer(0) for points in rings]
        depth = [sum(other.contains(Point(ring[0])) for j,other in enumerate(shells) if j!=i)
                 for i,ring in enumerate(rings)]
        for i, ring in enumerate(rings):
            if depth[i]%2: continue
            holes = [rings[j] for j in range(len(rings))
                     if depth[j]==depth[i]+1 and shells[i].contains(Point(rings[j][0]))]
            polygon = Polygon(ring,holes).buffer(0)
            polygons.extend(list(polygon.geoms) if polygon.geom_type=='MultiPolygon' else [polygon])
        cursor += font['hmtx'][name][0]/units+.009
    xmin,ymin = min(p.bounds[0] for p in polygons),min(p.bounds[1] for p in polygons)
    xmax,ymax = max(p.bounds[2] for p in polygons),max(p.bounds[3] for p in polygons)
    center = np.array([(xmin+xmax)/2,(ymin+ymax)/2])
    vertices = []
    for polygon in polygons:
        rings = [np.array(polygon.exterior.coords)[:-1],*[np.array(r.coords)[:-1] for r in polygon.interiors]]
        coords = np.concatenate(rings)
        indices = mapbox_earcut.triangulate_float64(coords,np.cumsum([len(r) for r in rings],dtype='uint32'))
        for index in indices:
            x,y = coords[index]-center
            vertices.append([x,y,.14,0,0,1])
        for ring in rings:
            for a,b in zip(ring,np.roll(ring,-1,axis=0)):
                direction = b-a
                normal = np.array([direction[1],-direction[0],0])
                normal /= max(np.linalg.norm(normal),1e-8)
                a,b = a-center,b-center
                quad = [[*a,-.16],[*b,-.16],[*b,.14],[*a,.14]]
                for index in [0,1,2,0,2,3]: vertices.append([*quad[index],*normal])
    font.close()
    return np.array(vertices,dtype='f4'),xmax-xmin


class Sign:
    def __init__(self,font_path,style='blue',render_scale=1):
        self.style = style
        self.render_scale = render_scale
        self.ctx = moderngl.create_standalone_context(require=330)
        self.ctx.enable(moderngl.DEPTH_TEST)
        vertices,self.width = text_mesh(font_path,grounded=style in ('cardboard','blue-grounded','blue-large','blue-refined'))
        self.bottom = vertices[:,1].min()
        self.program = self.ctx.program(vertex_shader='''#version 330
            in vec3 position; in vec3 normal;
            uniform mat4 model; uniform mat4 projection;
            out vec3 n; out vec3 p;
            void main() {
                vec4 world=model*vec4(position,1.0);
                n=normalize(mat3(model)*normal); p=position;
                gl_Position=projection*world;
            }''',fragment_shader='''#version 330
            in vec3 n; in vec3 p;
            uniform bool cardboard;
            uniform bool cool_cardboard;
            uniform bool blue_cardboard;
            uniform bool classic_cardboard;
            uniform float light_level;
            out vec4 frag;
            float grain(vec3 point) {
                return fract(sin(dot(point,vec3(127.1,311.7,74.7)))*43758.5453);
            }
            void main() {
                vec3 normal=normalize(n);
                float light=max(dot(normal,normalize(vec3(-0.5,0.8,1.4))),0.0);
                float highlight=pow(max(dot(normal,normalize(vec3(-0.3,0.4,1.8))),0.0),32.0);
                float front=smoothstep(0.4,0.8,normal.z);
                vec3 face=mix(vec3(0.16,0.47,0.95),vec3(0.82,0.96,1.0),clamp(p.y+0.55,0.0,1.0));
                vec3 color=mix(vec3(0.025,0.16,0.39),face,front)*(0.42+0.7*light)+vec3(0.35)*highlight;
                if(cardboard) {
                    float fibre=grain(floor(p*vec3(1800.0,1300.0,900.0)));
                    float paper=grain(floor(p*vec3(135.0,160.0,150.0)));
                    float layers=sin(p.z*610.0)*0.045;
                    vec3 kraft=vec3(0.67,0.49,0.29)+(fibre-0.5)*0.07+(paper-0.5)*0.045;
                    vec3 edge=vec3(0.42,0.285,0.145)+layers+(fibre-0.5)*0.06;
                    if(cool_cardboard) {
                        kraft=vec3(0.63,0.68,0.69)+(fibre-0.5)*0.07+(paper-0.5)*0.045;
                        edge=vec3(0.22,0.25,0.27)+layers+(fibre-0.5)*0.06;
                    }
                    if(blue_cardboard) {
                        kraft=vec3(0.29,0.55,0.82)+(fibre-0.5)*0.05+(paper-0.5)*0.035;
                        edge=vec3(0.065,0.19,0.36)+layers+(fibre-0.5)*0.04;
                    }
                    if(classic_cardboard) {
                        kraft=face+(fibre-0.5)*0.025;
                        edge=vec3(0.025,0.16,0.39)+layers*0.35;
                    }
                    color=mix(edge,kraft,front)*(0.59+0.51*light)*light_level;
                }
                frag=vec4(color,1.0);
            }''')
        self.program['cardboard'].value = style in ('cardboard','blue-grounded','blue-large','blue-refined')
        self.program['cool_cardboard'].value = style=='blue-grounded'
        self.program['blue_cardboard'].value = style=='blue-large'
        self.program['classic_cardboard'].value = style=='blue-refined'
        self.vao = self.ctx.vertex_array(self.program,[(self.ctx.buffer(vertices.tobytes()),'3f 3f','position','normal')])
        size = (W*render_scale,H*render_scale)
        self.fbo = self.ctx.framebuffer([self.ctx.texture(size,4)],self.ctx.depth_renderbuffer(size))
        self.msaa = self.ctx.framebuffer([self.ctx.renderbuffer(size,samples=4)],self.ctx.depth_renderbuffer(size,samples=4))
        projection = np.diag([2/W,2/H,-1/1000,1]).astype('f4')
        self.program['projection'].write(projection.T.tobytes())

    def render(self,phase):
        target_width = 680 if self.style=='blue-refined' else 760 if self.style=='blue-large' else 580 if self.style=='blue-grounded' else 440
        scale = target_width/self.width
        yaw,pitch = -.28+.035*math.sin(phase),.16+.025*math.sin(phase+.8)
        if self.style in ('cardboard','blue-grounded','blue-large','blue-refined'): yaw,pitch = -.23,.10
        cy,sy,cx,sx = math.cos(yaw),math.sin(yaw),math.cos(pitch),math.sin(pitch)
        rotation = np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]) @ np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]])
        model = np.eye(4,dtype='f4')
        model[:3,:3] = rotation*scale
        model[:3,3] = [0,-43+2*math.sin(phase),0]
        if self.style=='cardboard':
            model[:3,3] = [0,-85-self.bottom*scale*cx,0]
        if self.style in ('blue-grounded','blue-large'):
            model[:3,3] = [0,-133-self.bottom*scale*cx,0]
        if self.style=='blue-refined':
            model[:3,3] = [0,-105-self.bottom*scale*cx,0]
        self.program['light_level'].value = .98+.035*math.sin(phase) if self.style in ('cardboard','blue-grounded','blue-large','blue-refined') else 1
        self.program['model'].write(model.T.tobytes())
        self.msaa.use()
        self.ctx.viewport = (0,0,W*self.render_scale,H*self.render_scale)
        self.msaa.clear(0,0,0,0,depth=1)
        self.vao.render()
        self.ctx.copy_framebuffer(self.fbo,self.msaa)
        return np.frombuffer(self.fbo.read(components=4),dtype='uint8').reshape(H*self.render_scale,W*self.render_scale,4)[::-1].astype('float32')/255


def foreground_matte(frame,tight=False):
    """Keep connected audience silhouettes, including their illuminated rims."""
    value = frame.max(axis=2)
    core = (value<118).astype('uint8')
    _,labels,_,_ = cv2.connectedComponentsWithStats(core,8)
    audience_labels = np.unique(labels[H-90:])
    audience_labels = audience_labels[audience_labels!=0]
    core = np.isin(labels,audience_labels).astype('float32')
    if tight:
        # Keep the transition within one pixel of the silhouette. A wide
        # dilation would carry a strip of concert background over the letters.
        return cv2.GaussianBlur(core,(3,3),.5)
    # Expand only a narrow rim around actual silhouettes, without treating the
    # entire dimly lit stage as foreground.
    rim = cv2.dilate(core,np.ones((9,9),dtype='uint8'))
    edge = np.clip((215-value.astype('float32'))/60,0,1)*rim
    matte = np.maximum(core,edge)
    return cv2.GaussianBlur(matte,(3,3),.45)


def composite_clean_edges(source,edited,matte,coverage):
    """Remove the old backdrop contribution from partially covered edge pixels."""
    alpha = matte[:,:,None]
    old_background = cv2.dilate(source,np.ones((7,7),dtype='uint8'))
    foreground = np.clip(source-old_background*(1-alpha),0,alpha)
    composed = foreground+edited*(1-alpha)
    affected = coverage[:,:,None]
    return composed*affected+source*(1-affected)


def grade(frame,style):
    hsv = cv2.cvtColor(frame.astype('uint8'),cv2.COLOR_RGB2HSV).astype('float32')
    if style=='cardboard':
        hsv[:,:,0] = np.clip(hsv[:,:,0]*.72+5,18,39)
        hsv[:,:,1] = np.clip(hsv[:,:,1]*.53,0,142)
        hsv[:,:,2] = np.power(hsv[:,:,2]/255,1.06)*235
    else:
        hsv[:,:,0] = 111-9*(hsv[:,:,2]/255)**1.7
        hsv[:,:,1] = np.clip(223-72*(hsv[:,:,2]/255)**2,145,225)
        hsv[:,:,2] *= .98
    return cv2.cvtColor(hsv.astype('uint8'),cv2.COLOR_HSV2RGB).astype('float32')/255


def edit(frame,sign,phase):
    # Remove the center performer and microphone before reflecting the scene.
    # Feathering and a dark-foreground mask preserve the audience silhouettes.
    y,x = np.mgrid[0:H,0:W].astype('float32')
    box = np.minimum.reduce([(x-564)/12,(722-x)/12,(y-322)/12,(510-y)/12])
    region = np.clip(box,0,1)
    value = frame.max(axis=2)
    foreground = np.clip((82-value.astype('float32'))/22,0,1)
    foreground = cv2.GaussianBlur(foreground,(3,3),.6)
    improved = sign.style in ('blue-large','blue-clean','blue-refined')
    if improved: foreground = foreground_matte(frame,tight=sign.style=='blue-refined')
    # Reconstruct illuminated haze from both sides of the stage. Inpainting
    # from the audience below would drag dark silhouettes into the empty stage.
    left = np.percentile(frame[:,530:564],88,axis=1).astype('float32')
    right = np.percentile(frame[:,722:756],88,axis=1).astype('float32')
    left = cv2.GaussianBlur(left[:,None,:],(1,31),7)[:,0,:]
    right = cv2.GaussianBlur(right[:,None,:],(1,31),7)[:,0,:]
    horizontal = np.clip((x-564)/(722-564),0,1)[:,:,None]
    repaired = left[:,None,:]*(1-horizontal)+right[:,None,:]*horizontal
    blend = region[:,:,None]*(1-foreground[:,:,None])
    clean = frame*(1-blend)+repaired*blend
    clean = clean[:,::-1].astype('uint8')
    foreground = foreground[:,::-1]
    blue = grade(clean,sign.style)
    source_blue = grade(frame[:,::-1],sign.style) if improved else None
    if sign.style=='blue-clean':
        result = source_blue*foreground[:,:,None]+blue*(1-foreground[:,:,None])
        return np.clip(result*255,0,255).astype('uint8')
    letters = sign.render(phase)
    # The foreground hands occlude the stage sign; bright fog receives a glow.
    alpha = letters[:,:,3]*(1-foreground)
    if sign.style=='cardboard':
        # A shallow stage riser and contact shadows ground the physical letters.
        floor_mask = np.zeros((H,W),dtype='float32')
        cv2.fillConvexPoly(floor_mask,np.array([[393,435],[887,435],[918,457],[362,457]],dtype='int32'),1)
        cv2.rectangle(floor_mask,(362,457),(918,466),.85,-1)
        floor_mask = cv2.GaussianBlur(floor_mask,(3,3),.6)*(1-foreground)
        shade = np.clip((y-435)/31,0,1)[:,:,None]
        floor_color = np.array([.20,.17,.10])*(1-shade)+np.array([.065,.059,.038])*shade
        blue = blue*(1-floor_mask[:,:,None])+floor_color*floor_mask[:,:,None]
        columns = cv2.GaussianBlur(letters[:,:,3].max(axis=0)[None,:],(15,1),3)[0]
        contact = np.exp(-((y-448)/3)**2)*columns[None,:]*.6*(1-foreground)
        blue *= 1-contact[:,:,None]
    elif sign.style in ('blue-grounded','blue-large','blue-refined'):
        # Soft contact shadows only: no added platform and no floating glow.
        columns = cv2.GaussianBlur(letters[:,:,3].max(axis=0)[None,:],(15,1),3)[0]
        contact_y = 468 if sign.style=='blue-refined' else 496
        contact = np.exp(-((y-contact_y)/4)**2)*columns[None,:]*.45*(1-foreground)
        blue *= 1-contact[:,:,None]
    else:
        glow = cv2.GaussianBlur(letters[:,:,:3],(0,0),9)*.17
        blue = np.clip(blue+glow*(1-foreground[:,:,None]),0,1)
    result = letters[:,:,:3]*(1-foreground[:,:,None])+blue*(1-alpha[:,:,None])
    if sign.style=='blue-refined':
        # Lay down the sign, then restore the audience using unpolluted edge
        # colors rather than pasting the source's blue backdrop around hands.
        edited = letters[:,:,:3]+blue*(1-letters[:,:,3:4])
        coverage = np.maximum(region[:,::-1],letters[:,:,3])
        coverage = np.maximum(coverage,contact)
        result = composite_clean_edges(source_blue,edited,foreground,coverage)
    elif improved:
        # Restore original graded audience pixels last, above all scene edits.
        # Dense parts of hands therefore receive no haze repair or lettering.
        result = source_blue*foreground[:,:,None]+result*(1-foreground[:,:,None])
    return np.clip(result*255,0,255).astype('uint8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview',action='store_true')
    parser.add_argument('--font',default='C:/Windows/Fonts/arialbd.ttf')
    parser.add_argument('--style',choices=['blue','cardboard','blue-grounded','blue-large','blue-clean','blue-refined'],default='blue')
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True,exist_ok=True)
    sign = Sign(args.font,args.style)
    name = f'{args.style}-javascript'
    reader = imageio_ffmpeg.read_frames(str(ROOT/'frontend/public/hero-video.mp4'),pix_fmt='rgb24')
    metadata = next(reader)
    count = round(metadata['duration']*metadata['fps'])
    assert metadata['size']==(W,H)
    writer = None
    if not args.preview:
        writer = imageio_ffmpeg.write_frames(str(OUTPUT/f'{name}.mp4'),(W,H),fps=metadata['fps'],codec='libx264',
            output_params=['-crf','19','-preset','medium','-movflags','+faststart','-an'],macro_block_size=1)
        writer.send(None)
    try:
        for index, raw in enumerate(reader):
            if args.preview and index not in [0,96,192,288,384]: continue
            source = np.frombuffer(raw,dtype='uint8').reshape(H,W,3)
            result = edit(source,sign,math.tau*index/count)
            if index==0:
                if not args.preview: Image.fromarray(result).save(OUTPUT/f'{name}.webp',quality=91)
            if args.preview: Image.fromarray(result).save(ROOT/f'.local/{args.style}-stage-preview-{index}.png')
            if writer: writer.send(result.tobytes())
            if index%48==0: print(f'{index}/{count}',flush=True)
    finally:
        reader.close()
        if writer: writer.close()
    print(f'Finished {args.style} JavaScript stage',flush=True)


if __name__=='__main__':
    main()
