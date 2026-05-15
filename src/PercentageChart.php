<?php

declare(strict_types=1);

namespace Orchid\Charts;

use Orchid\Charts\Renderers\PercentageRenderer;
use Orchid\Charts\Renderers\Renderer;

final readonly class PercentageChart extends Chart
{
    /**
     * Create the default renderer for this chart type.
     */
    protected function defaultRenderer(): Renderer
    {
        return new PercentageRenderer;
    }
}
