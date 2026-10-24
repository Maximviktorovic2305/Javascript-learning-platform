# Hero animation previews

| Address               | Variant                                                             |
| --------------------- | ------------------------------------------------------------------- |
| http://localhost:3020 | Selected blue scene, matching port 3025                              |
| http://localhost:3021 | Wave: light clay figures with lime accents                          |
| http://localhost:3022 | Team: colorful figures with raised hands                            |
| http://localhost:3023 | Pixels: an isometric block character crowd                          |
| http://localhost:3025 | Smooth 1440p lettering with additional lit-hand recovery |
| http://localhost:3026 | Raised light-blue lettering, clean silhouette edges, no podium |
| http://localhost:3027 | The same blue scene without lettering, with preserved audience |

## Selected port-3025 version

The current preset is `blue-full-hands-javascript`. `restore_lit_hands.py` patches
an additional audience layer over the actual saved `blue-smooth-javascript.mp4`.
It recovers illuminated fingers, palms and wrists using local contrast against
the stage haze, constrained to the existing audience's vicinity. Dark detached
palms below the stage performer are seeded independently, so a bright gap at a
wrist no longer discards the whole silhouette. Recovery is
feathered and excludes the removed performer's upper silhouette and torso.
Original dark silhouettes are never subtracted. No font geometry is re-rendered,
and raw pixels outside the additional layer are asserted identical to the base.
Output: 2560x1440, 430 frames, H.264 CRF 14, silent, faststart, matching poster.

```powershell
python scripts/hero-video/restore_lit_hands.py
python scripts/hero-video/check_lit_hands.py
```

The exact state before this recovery is saved in
`.local/rollback/hands-before-20261023/` with SHA-256 manifests, configuration,
source files and media. Docker image `script-lab-frontend:rollback-hands-20261023`
also retains the prior application. Do not overwrite this checkpoint. Restore
only on the user's explicit undo request; the prior preset is
`blue-smooth-javascript`, and the media remain available under that name.

The preceding preset is `blue-smooth-javascript`, rendered by `smooth_blue_stage.py`.
It rebuilds the original blue sign directly from denser font curves with 4x MSAA
at 3840x2160, then resolves to a 2560x1440 video. The original composition, sign
size, pose, blue face gradient and timing are retained. The source footage has
1280x720 detail; the lettering is rendered at the new resolution. No previous
encoded sign is reused. Clean audience silhouettes are restored last, and dense
source hand pixels are asserted unchanged in all 430 raw frames. The output
uses H.264 CRF 16 and a matching high-quality poster. Rebuild with:

```powershell
python scripts/hero-video/smooth_blue_stage.py
python scripts/hero-video/check_smooth_video.py
```

Files: `blue-smooth-javascript.mp4` and `blue-smooth-javascript.webp`.
`--preview` writes five PNG frames to `.local/`. The previous repaired version
below remains available for rollback, along with the original blue movie.

The preceding hand-repaired version uses the actual existing `blue-javascript.mp4` as its base.
`preserve_blue_hands.py` repairs the audience silhouettes from the graded
original footage, preserving the first blue version's lettering, size, position,
animation, lighting and composition. Pixels outside the foreground repair band
are asserted identical to the decoded base before encoding; dense hand pixels
are checked against the source on every frame. Antialiased edges are cleaned of
the old background color before compositing.

```powershell
python scripts/hero-video/preserve_blue_hands.py
docker compose -f compose.yaml -f compose.hero-previews.yaml build frontend
docker compose -f compose.yaml -f compose.hero-previews.yaml up --no-deps -d hero-blue-javascript
```

Files: `blue-preserved-javascript.mp4` and `blue-preserved-javascript.webp` in
`frontend/public/hero-variants/`. Select with
`NUXT_PUBLIC_HERO_VARIANT=blue-preserved-javascript`. The base movie remains
unchanged as `blue-javascript.mp4`, and can still be selected using
`NUXT_PUBLIC_HERO_VARIANT=blue-javascript`. This remains a derivative of the
reference footage. `--preview` writes five sample PNGs to `.local/`.

## Other stage revisions

The current revision is available on http://localhost:3026. It uses blue lighting
and the first sign's light-blue face gradient with dark-blue extruded edges.
The word is 680 px wide, down from 760 px, and raised by 28 px. The letters stay
fixed, with soft contact shadows and no podium. A separate version without
lettering remains available on http://localhost:3027.

Audience silhouettes are restored above the scene edits. The current sign uses
a tight antialiased edge rather than a dilated rim, subtracting the source
background contribution from boundary pixels to avoid blue halos over letters.
`check_foreground.py` checks dense source audience pixels in five sampled frames,
with and without lettering, and verifies edge color decontamination against a
synthetic antialiased silhouette with a known background.

```powershell
python scripts/hero-video/blue_stage.py --style blue-refined
python scripts/hero-video/blue_stage.py --style blue-clean
python scripts/hero-video/check_foreground.py
docker compose up --no-deps --build -d frontend
docker compose -f compose.yaml -f compose.hero-previews.yaml up --no-deps -d hero-cardboard-javascript hero-blue-clean
```

Its files are `frontend/public/hero-variants/blue-refined-javascript.mp4` and
`blue-refined-javascript.webp`; select it with
`NUXT_PUBLIC_HERO_VARIANT=blue-refined-javascript`. The preceding larger version
is preserved as `blue-large-javascript.mp4` and its matching poster. The variant without lettering
uses `blue-clean-javascript.mp4`, its matching poster, and
`NUXT_PUBLIC_HERO_VARIANT=blue-clean-javascript`. The previous smaller blue
version remains in `blue-grounded-javascript.mp4` with its matching poster.
The previous warm version
with a podium remains in `cardboard-javascript.mp4` and its matching poster;
it can still be selected with `NUXT_PUBLIC_HERO_VARIANT=cardboard-javascript`.
Original and blue media are not overwritten. This remains edited reference
footage with the same rights caveat.

## Blue JavaScript stage

The variant on port 3025 is edited from the original concert video. It mirrors
the scene, grades the moving lighting to blue tones, replaces the center
performer and microphone with reconstructed haze, and composites an animated
extruded JavaScript sign. Dark foreground audience hands occlude the sign.
This is a derivative of the reference footage; these edits do not establish
permission to publish the original footage.

The editable recipe is `blue_stage.py`. Its OpenGL font mesh uses local Arial
Bold by default; `--font` can specify another TrueType font. No font file is
copied into the website. Rebuild with:

```powershell
python scripts/hero-video/blue_stage.py
docker compose up --no-deps --build -d frontend
docker compose -f compose.yaml -f compose.hero-previews.yaml up --no-deps -d hero-blue-javascript
```

`--preview` writes five PNG samples to `.local/` without replacing the final
video. The output is `frontend/public/hero-variants/blue-javascript.mp4` with a
matching WebP poster, 1280 × 720 at 24 fps, with the original duration and no
audio. The original MP4 and poster remain unchanged. The main port 3020 still
uses `original`; the new preview uses `NUXT_PUBLIC_HERO_VARIANT=blue-javascript`.

## Procedural crowd alternatives

The three new videos and posters are rendered from original procedural geometry
in `render.py`. They do not use the original site's footage, poster, textures,
models, or frames as rendering inputs. They are silent 8-second H.264 MP4 loops,
1280 × 720, 24 fps, with WebP posters. Motion remains pausable and respects reduced
motion and page visibility. Every animation is periodic over its full duration.

The original reference files `frontend/public/hero-video.mp4` and
`frontend/public/hero-crowd.webp` remain unchanged for local comparison. Their
original source is Music Labs; preserving them does not establish permission to
publish them. Local backup source files and reference checksums are kept in
`.local/hero-backup/`.

## Render again

Use a Python environment with OpenGL 3.3 support:

```powershell
python -m pip install -r scripts/hero-video/requirements.txt
python scripts/hero-video/render.py
```

`--preview` renders one PNG per variant into `.local/`; `--variant wave` (or
`team` / `pixels`) limits rendering to one variant. The renderer uses ModernGL
with instanced geometry, directional shadows and antialiasing; FFmpeg encodes
the result. No browser is used.

## Start comparison pages

Build the shared frontend image after rendering the files:

```powershell
docker compose up --no-deps --build -d frontend
docker compose -f compose.yaml -f compose.hero-previews.yaml up --no-deps -d hero-wave hero-team hero-pixels
```

Preview ports bind only to localhost. They are for choosing the landing hero;
the primary application and backend settings remain on port 3020.

Stop only the preview containers:

```powershell
docker compose -f compose.yaml -f compose.hero-previews.yaml stop hero-wave hero-team hero-pixels
```

## Selection and rollback

`NUXT_PUBLIC_HERO_VARIANT` selects a preset defined in `HeroScene.vue` at
container startup, without rebuilding. The default is `blue-full-hands-javascript`; an
unknown value falls back to `original`. To adopt another variant on the primary frontend, add
that environment variable to the `frontend` service and recreate that service.
To return to the reference, set it to `original`, then
recreate the frontend. This does not change the database or learning content.
