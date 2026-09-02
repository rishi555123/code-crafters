# Test Images — REAL Integration Mode

This directory holds the real rock/crack sample images used by the sensor
simulator in **REAL integration mode** (`python main.py --mode real`).

> ⚠️ **No images exist yet.** Suitable rock/crack sample images were not found
> anywhere in the repository during inspection (the only model file present is
> `computer-vision/models/crack-seg-best.pt`, which is a YOLO model, not an
> image). This README documents where the team should place them.

## Directory Layout

```
test-images/
├── safe/        → contains image(s) of a stable slope with no/few cracks
├── warning/     → contains image(s) of a slope with moderate cracking
└── critical/    → contains image(s) of a heavily cracked/high-risk slope
```

## How the simulator uses them

When you run, for example:

```bash
python main.py --mode real --scenario safe
```

the simulator sends the **first image found** in `test-images/safe/` to the
real backend:

```
POST http://localhost:8080/api/analysis/cv
Content-Type: multipart/form-data
    image   = <test-images/safe/<first image>>
    zone_id = SLOPE_A
```

Supported image extensions: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.tiff`, `.webp`.

## What to place here

| Scenario | Directory | Suggested image subject |
|---|---|---|
| SAFE | `test-images/safe/` | Stable rock slope, no visible cracking (expect CV `crack_detected=false`, severity `NONE`/`LOW`) |
| WARNING | `test-images/warning/` | Slope with moderate crack (expect CV severity `MEDIUM`) |
| CRITICAL | `test-images/critical/` | Heavily cracked slope (expect CV severity `HIGH`) |

## Important notes

- Do **not** place images inside `computer-vision/` — that module must not be
  modified. Put scenario images here instead.
- The first image uploaded for a zone becomes CV's in-memory deformation
  reference baseline. See `computer-vision/README.md` "Important Baseline
  Limitation" — on CV restart the reference clears.
- The zone must already exist in the backend Postgres `zones` table
  (`SLOPE_A`, `SLOPE_B`, `SLOPE_C`), otherwise the backend returns a 500
  "Zone not found" error.
- Do not commit large/generated images to the repo unless intended; this
  folder is intentionally empty apart from this README.
