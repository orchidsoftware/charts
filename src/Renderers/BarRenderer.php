<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers;

use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Renderers\Tooltip\AxisHoverEntry;
use Orchid\Charts\Renderers\Tooltip\AxisSeriesContext;
use Orchid\Charts\StyledChart;
use Orchid\Charts\SVG\SvgElement;

final readonly class BarRenderer extends AxisRenderer
{
    /**
     * Build bar-specific series elements.
     *
     * @param  array<int, list<AxisHoverEntry>>  $slotEntries
     * @return list<SvgElement>
     */
    #[\Override]
    protected function renderSeries(
        StyledChart $chart,
        Dataset $dataset,
        AxisSeriesContext $context,
        array &$slotEntries,
    ): array {
        return $this->renderBars($dataset, $context, $slotEntries);
    }
}
