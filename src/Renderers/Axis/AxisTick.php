<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Axis;

final readonly class AxisTick
{
    /**
     * Create a new axis tick instance.
     */
    public function __construct(
        public float $value,
        public float $position,
        public string $label,
    ) {}
}
