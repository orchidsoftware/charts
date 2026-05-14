<?php

declare(strict_types=1);

namespace Orchid\Charts\Axis;

final readonly class AxisTick
{
    public function __construct(
        public float $value,
        public float $position,
        public string $label,
    ) {}
}
