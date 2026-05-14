<?php

declare(strict_types=1);

namespace Orchid\Charts\Charts;

use Orchid\Charts\Enums\ChartType;

final readonly class LineChart extends AbstractChart
{
    public function type(): ChartType
    {
        return ChartType::Line;
    }
}
