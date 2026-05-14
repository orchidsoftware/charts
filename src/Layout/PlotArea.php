<?php

declare(strict_types=1);

namespace Orchid\Charts\Layout;

final readonly class PlotArea
{
    public function __construct(
        public int $x,
        public int $y,
        public int $width,
        public int $height,
    ) {}

    public function bottom(): int
    {
        return $this->y + $this->height;
    }

    public function right(): int
    {
        return $this->x + $this->width;
    }
}
