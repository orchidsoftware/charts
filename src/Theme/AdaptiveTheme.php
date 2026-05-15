<?php

declare(strict_types=1);

namespace Orchid\Charts\Theme;

interface AdaptiveTheme
{
    /**
     * Get the light theme instance.
     */
    public function light(): Theme;

    /**
     * Get the dark theme instance.
     */
    public function dark(): Theme;
}
