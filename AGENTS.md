## Project Theory

Static cockpit for VirtueBench.

- Front door first. Lead with the premise and one canonical case. Put mechanics, flips, and stable failures on their own surface.
- Fixed controls. Scroll the evidence, not the HUD.
- Read fast. Strong hierarchy, short labels, tabular numbers, direct copy.
- Surface economy. Prefer one strong shell, separators, and tint over nested cards and decorative shadow.
- Separate concerns. `virtue-bench` exports data; this repo renders it.
- Optimize transport first. Precompute, trim, split, and defer static payloads before adding client-side cache machinery.
- Replace when cleaner. No compatibility ballast before 1.0.
- Default to deployable static output.

## Notes

- Keep viewer state explicit. Prefer selected virtue, preset, models, and item over derived UI flags.
- Default front-door examples to the benchmark's `actual` frame.
- Remove duplicate controls and labels when the same state is already obvious.
- Treat copy as product surface. Short, concrete, non-academic.
- Brand the product as `VirtueBench`.
- If explanatory copy slows the front door, split it into a dedicated page.
- If a pane grows, make the pane scroll. Do not let anchors drift.
