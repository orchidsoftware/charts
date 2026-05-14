<?php

declare(strict_types=1);

namespace Orchid\Charts\Themes;

use Orchid\Charts\Contracts\AdaptiveTheme;
use Orchid\Charts\Contracts\Theme;

final readonly class Themes implements AdaptiveTheme
{
    private Theme $lightTheme;

    private Theme $darkTheme;

    public function __construct(?Theme $lightTheme = null, ?Theme $darkTheme = null)
    {
        $this->lightTheme = $lightTheme ?? new LightTheme;
        $this->darkTheme = $darkTheme ?? new DarkTheme;
    }

    public function light(): Theme
    {
        return $this->lightTheme;
    }

    public function dark(): Theme
    {
        return $this->darkTheme;
    }
}
