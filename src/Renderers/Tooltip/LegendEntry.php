<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

final readonly class LegendEntry
{
    /**
     * Create a new legend entry instance.
     */
    public function __construct(
        public string $label,
        public string $color,
    ) {}
}
