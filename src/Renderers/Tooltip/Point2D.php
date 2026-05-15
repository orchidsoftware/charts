<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

final readonly class Point2D
{
    /**
     * Create a new 2D point instance.
     */
    public function __construct(
        public float $x,
        public float $y,
    ) {}
}
