<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

use Orchid\Charts\Renderers\Axis\LinearScale;
use Orchid\Charts\Renderers\Axis\PlotArea;

final readonly class AxisSeriesContext
{
    /**
     * Create a new axis series rendering context.
     */
    public function __construct(
        public float $step,
        public PlotArea $area,
        public LinearScale $scale,
        public string $color,
        public int $datasetIndex,
        public int $datasetCount,
    ) {}
}
