<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

final readonly class TooltipBounds
{
    /**
     * Create a new tooltip bounds instance.
     */
    public function __construct(
        public float $minX,
        public float $maxX,
        public float $minY,
        public float $maxY,
    ) {}
}
