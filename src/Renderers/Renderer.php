<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers;

use Orchid\Charts\StyledChart;
use Orchid\Charts\SVG\SvgDocument;

interface Renderer
{
    /**
     * Render the chart into an SVG document.
     */
    public function render(StyledChart $chart): SvgDocument;
}
