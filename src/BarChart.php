<?php

declare(strict_types=1);

namespace Orchid\Charts;

use Orchid\Charts\Renderers\BarRenderer;
use Orchid\Charts\Renderers\Renderer;

final readonly class BarChart extends Chart
{
    /**
     * Create the default renderer for this chart type.
     */
    protected function defaultRenderer(): Renderer
    {
        return new BarRenderer;
    }
}
