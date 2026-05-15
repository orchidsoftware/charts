<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Axis;

final readonly class LinearScale
{
    /**
     * Create a new linear scale instance.
     */
    public function __construct(
        public float $min,
        public float $max,
        public PlotArea $area,
    ) {}

    /**
     * Create a linear scale from a list of values and plot area.
     *
     * @param  non-empty-list<int|float>  $values
     */
    public static function fromValues(array $values, PlotArea $area): self
    {
        $min = min($values);
        $max = max($values);

        if ($min > 0) {
            $min = 0;
        }

        if ($max < 0) {
            $max = 0;
        }

        if ($min === $max) {
            $min -= 1;
            $max += 1;
        }

        return new self((float) $min, (float) $max, $area);
    }

    /**
     * Map a numeric value to a Y-axis coordinate.
     */
    public function y(int|float $value): float
    {
        $range = $this->max - $this->min;

        return $this->area->bottom() - (($value - $this->min) / $range * $this->area->height);
    }

    /**
     * Get evenly spaced tick values for the current scale.
     *
     * @return list<float>
     */
    public function ticks(int $count = 5): array
    {
        $ticks = [];
        $step = ($this->max - $this->min) / max(1, $count - 1);

        for ($i = 0; $i < $count; $i++) {
            $ticks[] = $this->min + ($step * $i);
        }

        return $ticks;
    }
}
