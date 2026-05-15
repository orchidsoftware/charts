<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

final readonly class TooltipContent
{
    /**
     * Create tooltip content.
     */
    public function __construct(
        public string $label,
        public string $formattedValue,
        public string $absoluteValue,
        public string $color,
    ) {}
}
