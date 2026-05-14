<?php

declare(strict_types=1);

namespace Orchid\Charts\Charts;

use Orchid\Charts\Enums\ChartType;

final readonly class DonutChart extends AbstractChart
{
    public function type(): ChartType
    {
        return ChartType::Donut;
    }
}
