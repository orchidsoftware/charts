<?php

declare(strict_types=1);

namespace Orchid\Charts\Contracts;

use Orchid\Charts\SVG\SvgDocument;

interface Renderer
{
    public function render(Chart $chart): SvgDocument;
}
