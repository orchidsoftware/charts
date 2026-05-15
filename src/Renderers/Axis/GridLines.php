<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Axis;

final readonly class GridLines
{
    /**
     * Build horizontal grid lines for the provided ticks.
     *
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
