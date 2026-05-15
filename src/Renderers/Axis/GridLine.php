<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Axis;

final readonly class GridLine
{
    /**
     * Create a new grid line instance.
     */
    public function __construct(
        public float $x1,
        public float $y1,
        public float $x2,
        public float $y2,
    ) {}
}
