# Harmony and strategy matrix

This is a heuristic review through six documented design and product lenses. It
does not claim personal approval by Artemy Lebedev, David Heinemeier Hansson, or
Taylor Otwell.

Scores describe the demo after the large green thesis panel and blue closing
banner were introduced. `10` means the implementation strongly fits the lens.

| Lens                    | Harmony | Concision | Strategy | Keep                                                                  | Remove or reduce                                                           |
| ----------------------- | ------: | --------: | -------: | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Artemy Lebedev          |       4 |         4 |        7 | Direct promise, real charts, asymmetric layout                        | Duplicate promotional containers; decoration that doesn't improve the task |
| Apple HIG               |       4 |         5 |        7 | Clear primary action, adaptive hierarchy, restrained product surfaces | Multiple competing focal regions and oversized text treatments             |
| Microsoft Fluent        |       4 |         5 |        7 | Twelve-column rhythm, plain language, predictable controls            | Color surfaces without a distinct semantic role; inconsistent emphasis     |
| Basecamp / Getting Real |       5 |         4 |        8 | Human voice, actual product screens, opinionated copy                 | Marketing scaffolding around the real interface and repeated conclusions   |
| DHH / Rails doctrine    |       6 |         5 |        8 | A strong point of view, conventions, product questions before options | Repeating the doctrine after it is already understood                      |
| Laravel / Taylor Otwell |       5 |         5 |        8 | Immediate happy path, expressive API, polished defaults               | A separate CTA banner after the quick start already supplies the next step |

## Shared conclusion

The strategy is right, but the latest presentation overstates it. Harmony
returns when the page has one visual protagonist—the live product—and uses copy
as an editorial rhythm instead of turning every important sentence into a new
surface.

The balanced direction is therefore:

1. Keep `Charts that belong in your product` as the only dominant promise.
2. Remove the repeated product thesis; let the hero and live product carry it.
3. Keep one problem-first heading per chapter, without numbers or explanatory
   subtitles.
4. Remove the standalone closing banner and place one next action beside the
   real API example.
5. Let blue remain the interaction accent; don't introduce another large
   branded color field or heading layer.

## Primary references

- [Artemy Lebedev: simplicity](https://www.artlebedev.ru/kovodstvo/sections/108/),
  [logic and aesthetics](https://www.artlebedev.ru/kovodstvo/sections/109/), and
  [halving an interface](https://www.artlebedev.ru/kovodstvo/sections/110/)
- [Apple design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles),
  [layout](https://developer.apple.com/design/human-interface-guidelines/layout),
  and [materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Microsoft Fluent design principles](https://fluent2.microsoft.design/design-principles)
  and [layout](https://fluent2.microsoft.design/layout)
- [Basecamp: Getting Real](https://basecamp.com/gettingreal/01.1-what-is-getting-real)
- [The Rails Doctrine](https://rubyonrails.org/doctrine)
- [Laravel: Why Laravel?](https://laravel.com/framework/docs/12.x#why-laravel)
