<?php

declare(strict_types=1);

namespace Orchid\Charts\Enums;

enum ChartType: string
{
    case Line = 'line';
    case Bar = 'bar';
    case Pie = 'pie';
    case Donut = 'donut';
    case Percentage = 'percentage';
}
