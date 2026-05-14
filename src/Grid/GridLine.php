<?php

declare(strict_types=1);

namespace Orchid\Charts\Grid;

final readonly class GridLine
{
    public function __construct(
        public float $x1,
        public float $y1,
        public float $x2,
        public float $y2,
    ) {}
}
