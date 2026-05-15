<?php

declare(strict_types=1);

namespace Orchid\Charts\Theme;

final readonly class ThemeResolver
{
    /**
     * Resolve the light theme instance.
     *
     * @param  class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme  $theme
     */
    public function resolveLight(string|Theme|AdaptiveTheme $theme): Theme
    {
        if ($theme instanceof Theme) {
            return $theme;
        }

        if ($theme instanceof AdaptiveTheme) {
            return $theme->light();
        }

        $this->ensureThemeClassExists($theme);
        $resolved = new $theme;

        return $resolved instanceof Theme ? $resolved : $resolved->light();
    }

    /**
     * Resolve the dark theme instance when available.
     *
     * @param  class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme  $theme
     */
    public function resolveDark(string|Theme|AdaptiveTheme $theme): ?Theme
    {
        if ($theme instanceof AdaptiveTheme) {
            return $theme->dark();
        }

        if ($theme instanceof Theme) {
            return null;
        }

        $this->ensureThemeClassExists($theme);
        $resolved = new $theme;

        return $resolved instanceof AdaptiveTheme ? $resolved->dark() : null;
    }

    /**
     * Ensure a theme class-string points to an existing class.
     *
     * @param  class-string<Theme|AdaptiveTheme>  $theme
     */
    private function ensureThemeClassExists(string $theme): void
    {
        if (! class_exists($theme)) {
            throw new \InvalidArgumentException(sprintf('Theme class [%s] does not exist.', $theme));
        }
    }
}
