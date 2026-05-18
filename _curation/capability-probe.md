# v6.2 Capability Probe

Completed: 2026-05-18T03:42:16Z

## Summary

Phase 1 can proceed without blockers. The built-in `image_gen` tool works for prompt-only generation and produced a 1672 x 941 PNG from a 16:9 landscape prompt in 53 seconds. The tool surface available in this Codex session does not expose seed control, reference-image conditioning, destination path, explicit resolution selection, or a billing/cost readout. Style consistency therefore has to come from prompt discipline, the calibration gallery, manual exemplar selection, and the six-layer quality stack, not from deterministic generation controls.

## Image Generation Probe

- Tool: built-in Codex `image_gen`.
- Probe output copied to `_curation/probe/image-gen-capability-probe.png`.
- Original retained at `/home/molduser/.codex/generated_images/019e3898-0064-7181-b78b-14dbe5e82c26/ig_06520b275976bd94016a0a8a2764c0819ab25f3a94496c7a9b.png`.
- Output dimensions: 1672 x 941 PNG.
- Latency: 53 seconds.
- Reference-image conditioning: not available through the exposed tool schema.
- Seed reuse: not available through the exposed tool schema.
- Explicit cost per image: not available from the tool output.
- Working decision: use prompt-only generation with strict prompt templates and Dan-tagged exemplars.

## Optional Quality Stack Dependencies

Local isolated venv: `.venv-curation` (ignored by git).

| Layer | Probe Result | Decision |
| --- | --- | --- |
| OCR text detection | `pytesseract` installed, but system `tesseract` binary is not installed. `command -v tesseract` failed and `pytesseract.get_tesseract_version()` raised `TesseractNotFoundError`. | OCR layer unavailable unless system binary is later installed; log as skipped and rely on Codex vision for text/signage rejection in this run. |
| Person detection | `mediapipe` installed and imports as version `0.10.35`. | Use as available where practical; if model setup becomes heavier than the pass warrants, fall back to Codex vision and log the downgrade. |
| Prompt building-name check | No install required. | Enforce by string match against corridor names from the registry and forbidden prompt terms. |
| pHash dedupe | `imagehash` installed and computed pHash `8d04b4c9b358eb75` for the probe image. | Available. |
| CLIP exemplar similarity | `open-clip-torch` install attempted, but the default resolver began downloading a GPU-heavy Torch/CUDA stack larger than 1 GB. The install was killed as unreasonable for this pass. | Do not depend on CLIP locally. Use Codex vision qualitative comparison against Dan exemplars, scored per image, and record this downgrade. |
| Vision rubric scoring | Native Codex vision is available. | Available. Score each axis separately and keep the 4.0 composite floor. |

## Package / Conversion Notes

- `sharp` is not installed in the project yet.
- No system `ffmpeg`, ImageMagick `magick`, or ImageMagick `convert` binary is available.
- Promotion to AVIF/WebP should add `sharp` to the project toolchain or use a Next-compatible conversion path in Phase 4.

## Calibration Parameters Locked For Phase 2

- Aspect: 16:9 landscape.
- Subject rule: material, light, arrival, or category atmosphere only.
- Negative prompt rules: no people, no text, no signage, no logos, no recognizable buildings, no named properties, no addresses.
- Style rule: high-end editorial realism, warm daylight, restrained saturation, deep green / aged brass / warm stone palette, not CGI.
- Output handling: copy generated PNGs from the Codex generated-images directory into `_curation/calibration/`, keep sidecar JSON with prompt and prompt digest, then render the HTML exemplar gallery.
