<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers;

final readonly class DonutRenderer extends RadialRenderer
{
    /**
     * Determine whether the renderer should draw an inner donut hole.
     */
    #[\Override]
    protected function isDonut(): bool
    {
        return true;
    }
}
