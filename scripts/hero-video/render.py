"""Render original JSlab crowd animations from geometry, without source footage.

Setup: python -m pip install -r scripts/hero-video/requirements.txt
Run: python scripts/hero-video/render.py
Preview: python scripts/hero-video/render.py --preview
"""

import argparse
import math
from pathlib import Path

import imageio_ffmpeg
import moderngl
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'frontend/public/hero-variants'
WIDTH, HEIGHT, FPS, SECONDS = 1280, 720, 24, 8
TAU = math.tau


def unit(v):
    v = np.array(v, dtype='f4')
    return v / np.linalg.norm(v)


def look_at(eye, target):
    eye = np.array(eye, dtype='f4')
    z = unit(eye - target)
    x = unit(np.cross([0, 1, 0], z))
    y = np.cross(z, x)
    matrix = np.eye(4, dtype='f4')
    matrix[:3, :3] = [x, y, z]
    matrix[:3, 3] = -matrix[:3, :3] @ eye
    return matrix


def ortho(left, right, bottom, top, near, far):
    m = np.eye(4, dtype='f4')
    m[0, 0], m[1, 1], m[2, 2] = 2/(right-left), 2/(top-bottom), -2/(far-near)
    m[:3, 3] = [-(right+left)/(right-left), -(top+bottom)/(top-bottom), -(far+near)/(far-near)]
    return m


def mesh_sphere():
    vertices = []
    def point(u, v):
        n = [math.sin(v)*math.cos(u), math.cos(v), math.sin(v)*math.sin(u)]
        return n + n
    for j in range(12):
        for i in range(20):
            a, b = TAU*i/20, TAU*(i+1)/20
            c, d = math.pi*j/12, math.pi*(j+1)/12
            vertices += [point(a,c), point(a,d), point(b,d), point(a,c), point(b,d), point(b,c)]
    return np.array(vertices, dtype='f4')


def mesh_cube():
    vertices = []
    for axis in range(3):
        for sign in [-1, 1]:
            n = [0, 0, 0]
            n[axis] = sign
            corners = []
            for a,b in [(-1,-1), (1,-1), (1,1), (-1,1)]:
                p = [0,0,0]
                p[axis], p[(axis+1)%3], p[(axis+2)%3] = sign,a,b
                corners.append(p+n)
            vertices.extend([corners[k] for k in [0,1,2,0,2,3]])
    return np.array(vertices, dtype='f4')


VERTEX = '''#version 330
in vec3 position;
in vec3 normal;
in vec4 col0; in vec4 col1; in vec4 col2; in vec4 col3;
in vec3 color;
uniform mat4 camera;
uniform mat4 light_camera;
out vec3 world_normal;
out vec3 world_position;
out vec3 albedo;
out vec4 shadow_position;
void main() {
    mat4 model = mat4(col0,col1,col2,col3);
    vec4 p = model * vec4(position,1.0);
    vec3 scale2 = vec3(dot(col0.xyz,col0.xyz),dot(col1.xyz,col1.xyz),dot(col2.xyz,col2.xyz));
    world_normal = normalize(mat3(model) * (normal/scale2));
    world_position = p.xyz;
    albedo = color;
    shadow_position = light_camera * p;
    gl_Position = camera * p;
}'''

FRAGMENT = '''#version 330
in vec3 world_normal; in vec3 world_position; in vec3 albedo;
in vec4 shadow_position;
uniform sampler2DShadow shadow_map;
uniform vec3 eye;
uniform vec3 background;
out vec4 frag;
void main() {
    vec3 n = normalize(world_normal);
    vec3 l = normalize(vec3(-10.0,25.0,12.0));
    vec3 v = normalize(eye-world_position);
    vec3 sc = shadow_position.xyz/shadow_position.w*0.5+0.5;
    float bias = max(0.0015*(1.0-dot(n,l)),0.0005);
    float sh = 0.0;
    for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++)
        sh += texture(shadow_map,vec3(sc.xy+vec2(x,y)/2048.0,sc.z-bias))/9.0;
    float diffuse = max(dot(n,l),0.0);
    float specular = pow(max(dot(n,normalize(l+v)),0.0),44.0);
    float hemi = n.y*0.5+0.5;
    vec3 c = albedo*(0.29+hemi*0.25+diffuse*sh*0.65);
    c += vec3(0.28)*specular*sh;
    c += vec3(0.08,0.10,0.12)*pow(1.0-max(dot(n,v),0.0),3.0)*(1.0-max(n.y,0.0)*0.85);
    float fog = smoothstep(22.0,58.0,length(eye-world_position));
    c = mix(c,background,fog);
    frag = vec4(pow(c,vec3(1.0/2.2)),1.0);
}'''

DEPTH_VERTEX = '''#version 330
in vec3 position;
in vec4 col0; in vec4 col1; in vec4 col2; in vec4 col3;
uniform mat4 camera;
void main() { gl_Position=camera*mat4(col0,col1,col2,col3)*vec4(position,1.0); }
'''


class Renderer:
    def __init__(self):
        self.ctx = moderngl.create_standalone_context(require=330)
        print('Renderer:', self.ctx.info['GL_RENDERER'], flush=True)
        self.ctx.enable(moderngl.DEPTH_TEST)
        self.program = self.ctx.program(vertex_shader=VERTEX, fragment_shader=FRAGMENT)
        self.depth_program = self.ctx.program(vertex_shader=DEPTH_VERTEX, fragment_shader='#version 330\nvoid main() {}')
        self.instances = self.ctx.buffer(reserve=19*4*12000)
        self.vaos, self.depth_vaos = {}, {}
        for name, vertices in [('sphere',mesh_sphere()),('cube',mesh_cube())]:
            buffer = self.ctx.buffer(vertices.tobytes())
            self.vaos[name] = self.ctx.vertex_array(self.program, [
                (buffer,'3f 3f','position','normal'),
                (self.instances,'4f 4f 4f 4f 3f /i','col0','col1','col2','col3','color')])
            self.depth_vaos[name] = self.ctx.vertex_array(self.depth_program, [
                (buffer,'3f 12x','position'),
                (self.instances,'4f 4f 4f 4f 12x /i','col0','col1','col2','col3')])
        self.shadow = self.ctx.depth_texture((2048,2048))
        self.shadow.repeat_x = self.shadow.repeat_y = False
        self.shadow.filter = (moderngl.LINEAR,moderngl.LINEAR)
        self.shadow_fbo = self.ctx.framebuffer(depth_attachment=self.shadow)
        self.color = self.ctx.texture((WIDTH,HEIGHT),4)
        self.fbo = self.ctx.framebuffer([self.color],self.ctx.depth_renderbuffer((WIDTH,HEIGHT)))
        self.msaa = self.ctx.framebuffer([self.ctx.renderbuffer((WIDTH,HEIGHT),samples=4)],self.ctx.depth_renderbuffer((WIDTH,HEIGHT),samples=4))
        self.light = ortho(-24,24,-24,24,0.1,80) @ look_at([-10,25,12],np.array([0,0,0]))
        self.program['light_camera'].write(self.light.T.tobytes())
        self.depth_program['camera'].write(self.light.T.tobytes())

    def render(self, variant, seconds):
        data = scene(variant,seconds)
        instances = np.array(data,dtype='f4')
        self.instances.write(instances.tobytes())
        eye = [10,12,23] if variant == 'pixels' else [3.0,10.5,24]
        size = 11.6 if variant == 'wave' else 10.8
        if variant == 'pixels': size = 12.6
        camera = ortho(-size*WIDTH/HEIGHT/2,size*WIDTH/HEIGHT/2,-size/2,size/2,0.1,80) @ look_at(eye,np.array([0,3.8,0]))
        background = [0.004,0.006,0.009] if variant != 'team' else [0.004,0.009,0.018]
        self.shadow_fbo.use()
        self.ctx.viewport = (0,0,2048,2048)
        self.shadow_fbo.clear(depth=1)
        self.depth_vaos['cube' if variant == 'pixels' else 'sphere'].render(instances=len(data))
        self.msaa.use()
        self.ctx.viewport = (0,0,WIDTH,HEIGHT)
        self.msaa.clear(*[v**(1/2.2) for v in background],1,depth=1)
        self.program['camera'].write(camera.T.tobytes())
        self.program['eye'].value = tuple(eye)
        self.program['background'].value = tuple(background)
        self.shadow.use(0)
        self.program['shadow_map'].value = 0
        self.vaos['cube' if variant == 'pixels' else 'sphere'].render(instances=len(data))
        self.ctx.copy_framebuffer(self.fbo,self.msaa)
        return Image.frombytes('RGB',(WIDTH,HEIGHT),self.fbo.read(components=3)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)


def scene(variant, seconds):
    objects = []
    def shape(center,scale,color,rotation=None):
        m = np.eye(4,dtype='f4')
        m[:3,:3] = (np.eye(3) if rotation is None else rotation) @ np.diag(scale)
        m[:3,3] = center
        objects.append([*m.T.flatten(),*color])
    def limb(a,b,radius,color):
        a,b = np.array(a),np.array(b)
        y = unit(b-a)
        z = unit(np.cross(y,[1,0,0]))
        x = np.cross(y,z)
        rotation = np.column_stack((x,y,z))
        shape((a+b)/2,[radius,np.linalg.norm(b-a)/2+radius,radius],color,rotation)

    floor = [0.010,0.014,0.017] if variant != 'team' else [0.008,0.015,0.026]
    # Ellipsoid ground has a nearly flat crown; no imported textures or assets.
    shape([0,-1.05,0],[200,1,200],floor)
    ivory = [0.72,0.74,0.67]
    lime = [0.58,0.78,0.15]
    palette = [[0.82,0.63,0.05],[0.055,0.30,0.68],[0.70,0.19,0.13],[0.17,0.49,0.35],[0.48,0.32,0.65]]
    for row in range(4):
        for col in range(9):
            i = row*9+col
            if variant == 'team' and ((row==0 and col%3==0) or (row==3 and col%4==0)):
                continue
            rng = np.random.default_rng(i+313)
            x = (col-4)*1.55+(row%2)*0.32
            z = (row-1.5)*1.75
            if variant == 'team':
                z += 0.065*x*x
                x *= 1.08
            if variant == 'pixels':
                x = (col-4)*1.45
                z = (row-1.5)*1.7
            phase = TAU*seconds/SECONDS
            wave = 0.5+0.5*math.sin(phase-col*0.45-row*0.5)
            # Continuous periodic movement; the frame after the last is the first.
            raised = 0.2+0.8*(wave*wave*(3-2*wave))
            if variant == 'team': raised = 0.82+0.15*math.sin(phase+i*0.7)
            if variant == 'pixels': raised = 0.2+0.8*(0.5+0.5*math.sin(phase-row*0.7-col*0.36))**2
            height = float(rng.uniform(0.91,1.11))
            bob = 0.045*math.sin(phase*2+i)
            base = 0.17*(row%2) if variant == 'pixels' else 0
            if variant == 'pixels':
                shape([x,base/2-0.02,z],[0.65,max(base/2,0.035),0.67],[0.04,0.06,0.07])
            skin = ivory if variant == 'wave' else [[0.70,0.43,0.27],[0.31,0.15,0.09],[0.88,0.66,0.43]][i%3]
            shirt = (lime if i%7==0 else ivory) if variant == 'wave' else palette[i%len(palette)]
            pants = [0.15,0.18,0.19] if variant == 'wave' else [c*0.32 for c in shirt]
            def p(a,b,c=0): return np.array([x+a*height,base+(b+bob)*height,z+c*height])
            # Shoes, legs, torso, head. All silhouettes are modeled independently.
            for side in [-1,1]:
                shape(p(side*.17,.13,.05),[.145*height,.12*height,.22*height],pants)
                limb(p(side*.16,.22),p(side*.14,.92),.12*height,pants)
            shape(p(0,1.22),[.32*height,.48*height,.23*height],shirt)
            shape(p(0,1.73),[.105*height,.17*height,.10*height],skin)
            shape(p(0,2.03),[.235*height,.29*height,.23*height],skin)
            if variant != 'wave':
                hair = [0.045,0.025,0.018] if i%4 else [0.25,0.12,0.045]
                shape(p(0,2.17,-.025),[.242*height,.17*height,.231*height],hair)
                for side in [-1,1]:
                    shape(p(side*.077,2.04,.216),[.022*height,.027*height,.014*height],[.025,.019,.016])
            for side in [-1,1]:
                # A curved elbow and an open hand, independent left/right timing.
                lift = raised if side==1 else max(.04,raised-.22+0.12*math.sin(phase+i))
                shoulder = p(side*.27,1.53)
                angle = -0.7+lift*2.15
                elbow = shoulder + height*np.array([side*.43*math.cos(angle),.43*math.sin(angle),.02])
                foreangle = angle+.15
                wrist = elbow + height*np.array([side*.42*math.cos(foreangle),.42*math.sin(foreangle),.06])
                limb(shoulder,elbow,.10*height,shirt)
                shape(elbow,[.103*height]*3,shirt)
                limb(elbow,wrist,.075*height,skin)
                palm = wrist + height*np.array([side*.03,.08,.015])
                shape(palm,[.11*height,.135*height,.055*height],skin)
                for finger in range(4):
                    start = palm + height*np.array([(finger-1.5)*.047,.07,.0])
                    end = start + height*np.array([(finger-1.5)*.014,.13-(abs(finger-1.5)*.02),.0])
                    limb(start,end,.022*height,skin)
                limb(palm+height*np.array([side*.08,-.02,.015]),palm+height*np.array([side*.17,.07,.02]),.03*height,skin)
    return objects


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview',action='store_true')
    parser.add_argument('--variant',choices=['wave','team','pixels'])
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True,exist_ok=True)
    renderer = Renderer()
    for variant in [args.variant] if args.variant else ['wave','team','pixels']:
        if args.preview:
            target = ROOT / '.local' / f'hero-{variant}-preview.png'
            renderer.render(variant,1.7).save(target)
            print(target,flush=True)
            continue
        target = OUTPUT / f'{variant}.mp4'
        writer = imageio_ffmpeg.write_frames(str(target),(WIDTH,HEIGHT),fps=FPS,codec='libx264',quality=8,
            output_params=['-crf','20','-preset','medium','-movflags','+faststart','-an'],macro_block_size=1)
        writer.send(None)
        for frame in range(FPS*SECONDS):
            picture = renderer.render(variant,frame/FPS)
            if frame==0: picture.save(OUTPUT / f'{variant}.webp',quality=88)
            writer.send(picture.tobytes())
            if frame%24==0: print(f'{variant}: {frame}/{FPS*SECONDS}',flush=True)
        writer.close()
        print(f'Finished {target} ({target.stat().st_size} bytes)',flush=True)


if __name__ == '__main__':
    main()
