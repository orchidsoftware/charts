<?php

declare(strict_types=1);

namespace Orchid\Charts\Rendering;

use Orchid\Charts\Contracts\Renderer;
use Orchid\Charts\Enums\ChartType;

final readonly class RendererFactory
{
    public function make(ChartType $type): Renderer
    {
        return match ($type) {
            ChartType::Line, ChartType::Bar => new AxisRenderer,
            ChartType::Pie, ChartType::Donut => new RadialRenderer,
            ChartType::Percentage => new PercentageRenderer,
        };
    }
}
