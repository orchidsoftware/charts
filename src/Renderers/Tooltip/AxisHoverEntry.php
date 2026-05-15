<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

final readonly class AxisHoverEntry
{
    /**
     * Create a new axis hover entry instance.
     */
    public function __construct(
        public TooltipContent $tooltip,
        public string $type,
        public float $x,
        public float $y,
        public float $width,
        public float $height,
        public float $cx,
        public float $cy,
    ) {}

    /**
     * Determine whether the entry represents a bar segment.
     */
    public function isBar(): bool
    {
        return $this->type === 'bar';
    }
}
