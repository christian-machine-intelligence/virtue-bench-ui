## Project Theory

Static cockpit for VirtueBench.

- Front door first. Lead with the premise and one canonical case. Put mechanics, flips, and stable failures on their own surface.
- Fixed controls. Scroll the evidence, not the HUD.
- First-person over third-person. Prefer decision-maker framing over outside-judge framing.
- Read fast. Strong hierarchy, short labels, tabular numbers, direct copy.
- Surface economy. Prefer one strong shell, separators, and tint over nested cards and decorative shadow.
- Temptation, not ignorance. The benchmark is strongest when the wrong option is plausible, rationalized, and self-protective rather than openly vicious.
- Content over style. Do not add biblical or academic styling unless the content is doing real analytic work.
- Separate concerns. `virtue-bench` exports data; this repo renders it.
- Optimize transport first. Precompute, trim, split, and defer static payloads before adding client-side cache machinery.
- Replace when cleaner. No compatibility ballast before 1.0.
- Default to deployable static output.

## Notes

- Keep viewer state explicit. Prefer selected virtue, preset, models, and item over derived UI flags.
- Default front-door examples to the benchmark's `actual` frame.
- Benchmark-local claims only. Describe observed behavior, not training causes, unless the paper actually establishes causation.
- Frame ablation matters. Do not talk as if one prompt condition reveals stable moral reasoning by itself.
- Remove duplicate controls and labels when the same state is already obvious.
- Treat copy as product surface. Short, concrete, non-academic.
- Use plausible rationalization and self-preserving justification language when explaining failure modes.
- Brand the product as `VirtueBench`.
- Keep the front door plain. Put methodological nuance and theological vocabulary on `Method`, not `Summary`.
- Keep paper claims on the right surface. Front door states the premise; `Method` carries frame sensitivity and practical-preservation mechanics.
- If explanatory copy slows the front door, split it into a dedicated page.
- If a pane grows, make the pane scroll. Do not let anchors drift.
