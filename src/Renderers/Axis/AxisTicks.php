<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Axis;

use Orchid\Charts\Support\Precision;

final readonly class AxisTicks
{
    /**
     * Build axis ticks from a linear scale.
     *
     * @return list<AxisTick>
     */
    public function fromScale(LinearScale $scale, int $count = 5): array
    {
        $ticks = [];

        foreach ($scale->ticks($count) as $value) {
            $ticks[] = new AxisTick(
                value: $value,
                position: $scale->y($value),
                label: Precision::plain($value),
            );
        }

        return $ticks;
    }
}
