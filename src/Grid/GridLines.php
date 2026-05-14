<?php

declare(strict_types=1);

namespace Orchid\Charts\Grid;

use Orchid\Charts\Axis\AxisTick;
use Orchid\Charts\Layout\PlotArea;

final readonly class GridLines
{
    /**
     * @param  list<AxisTick>  $ticks
     * @return list<GridLine>
     */
    public function horizontal(PlotArea $area, array $ticks): array
    {
        $lines = [];

        foreach ($ticks as $tick) {
            $lines[] = new GridLine($area->x, $tick->position, $area->right(), $tick->position);
        }

        return $lines;
    }
}
