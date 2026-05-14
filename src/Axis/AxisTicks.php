<?php

declare(strict_types=1);

namespace Orchid\Charts\Axis;

use Orchid\Charts\Layout\LinearScale;

final readonly class AxisTicks
{
    /**
     * @return list<AxisTick>
     */
    public function fromScale(LinearScale $scale, int $count = 5): array
    {
        $ticks = [];

        foreach ($scale->ticks($count) as $value) {
            $ticks[] = new AxisTick(
                value: $value,
                position: $scale->y($value),
                label: (string) round($value, 2),
            );
        }

        return $ticks;
    }
}
