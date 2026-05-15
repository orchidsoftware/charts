<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Axis;

final readonly class PlotArea
{
    /**
     * Create a new plot area instance.
     */
    public function __construct(
        public int $x,
        public int $y,
        public int $width,
        public int $height,
    ) {}

    /**
     * Get the bottom Y coordinate of the plot area.
     */
    public function bottom(): int
    {
        return $this->y + $this->height;
    }

    /**
     * Get the right X coordinate of the plot area.
     */
    public function right(): int
    {
        return $this->x + $this->width;
    }
}
