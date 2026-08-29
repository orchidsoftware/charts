# PIE/DONUT tooltip design review

This is a heuristic review through documented design approaches. It is not a
transcript, endorsement, or personal approval by the named designers.

Target context: responsive web charts used with pointer, touch, keyboard, and
assistive technology. Critical composition meaning remains visible in the chart
and legend; the popover supplies details on demand.

| Lens                                | Role                                 | Rejected behavior                                                                      | Decision applied                                                                                                                       |   Score |
| ----------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------: |
| Artemy Lebedev (lead)               | Simplicity and visible logic         | Positioning by the invisible rectangular bounding box of an SVG arc                    | The visible slice is the target; one concise row appears beside that slice, with no decorative connector or duplicate fields           | 100/100 |
| Apple HIG — Charts, pointing, focus | Easy inspection across input methods | Precision-only pointing, hover-only meaning, or focus that moves the popover elsewhere | The entire slice responds; hover, focus, and selection share one stable anchor; keyboard and accessible descriptions remain equivalent | 100/100 |
| Microsoft Fluent — Tooltip          | Proximity and non-obstruction        | A floating tooltip that covers the donut total or an unrelated sector                  | The popover sits 8 px beyond the selected sector's outer arc and is clamped inside the visible chart viewport                          | 100/100 |
| Tognazzini / Nielsen consistency    | Predictability and acquisition cost  | Different placement for hover, pointer-down, focus, and persistent selection           | Every state reuses the same sector identity, content hierarchy, placement, and dismissal behavior                                      | 100/100 |

## Accepted contract

1. `PIE` and `DONUT` use the rendered slice itself as the interaction target.
2. Only the active slice receives hover, pressed, focus, or selected feedback.
3. The popover anchor is the midpoint of the slice's outer arc.
4. Placement follows the outward radial direction: top, right, bottom, or left,
   with an 8 px gap and viewport clamping.
5. `DONUT` popovers must not cover the center total when an outward placement is
   available.
6. Content stays concise: color swatch, category, formatted value, and share.
7. Hover, focus, and persistent selection must produce the same placement.
8. Real demo cards and interaction states require browser screenshot coverage.

## References

- [Artemy Lebedev, §108 — simplicity](https://www.artlebedev.ru/kovodstvo/sections/108/)
- [Apple HIG — Charts](https://developer.apple.com/design/human-interface-guidelines/charts)
- [Apple HIG — Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data)
- [Apple HIG — Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)
- [Apple HIG — Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)
- [Microsoft Fluent 2 — Tooltip](https://fluent2.microsoft.design/components/web/react/core/tooltip/usage)
- [Nielsen Norman Group — Consistency and standards](https://media.nngroup.com/media/articles/attachments/Heuristic_4_compressed.pdf)
