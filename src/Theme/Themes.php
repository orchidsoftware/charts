<?php

declare(strict_types=1);

namespace Orchid\Charts\Theme;

final readonly class Themes implements AdaptiveTheme
{
    private Theme $lightTheme;

    private Theme $darkTheme;

    /**
     * Create a new adaptive theme instance.
     */
    public function __construct(?Theme $lightTheme = null, ?Theme $darkTheme = null)
    {
        $this->lightTheme = $lightTheme ?? new LightTheme;
        $this->darkTheme = $darkTheme ?? new DarkTheme;
    }

    /**
     * Get the light theme instance.
     */
    public function light(): Theme
    {
        return $this->lightTheme;
    }

    /**
     * Get the dark theme instance.
     */
    public function dark(): Theme
    {
        return $this->darkTheme;
    }
}
