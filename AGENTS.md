## Project Theory

Static cockpit for VirtueBench results.

- Fixed controls. Scroll the evidence, not the HUD.
- Read fast. Strong hierarchy, short labels, tabular numbers.
- Separate concerns. `virtue-bench` exports data; this repo renders it.
- Replace when cleaner. No compatibility ballast before 1.0.
- Default to deployable static output.

## Notes

- Keep viewer state explicit. Prefer selected virtue, preset, models, and item over derived UI flags.
- Treat copy as product surface. Short, concrete, non-academic.
- If a pane grows, make the pane scroll. Do not let anchors drift.
