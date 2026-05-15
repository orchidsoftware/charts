<?php

declare(strict_types=1);

namespace Orchid\Charts;

use Orchid\Charts\Renderers\DonutRenderer;
use Orchid\Charts\Renderers\Renderer;

final readonly class DonutChart extends Chart
{
    /**
     * Create the default renderer for this chart type.
     */
    protected function defaultRenderer(): Renderer
    {
        return new DonutRenderer;
    }
}
