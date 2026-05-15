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

        $resolved = new $theme;

        return $resolved instanceof AdaptiveTheme ? $resolved->dark() : null;
    }

    /**
     * @deprecated Use resolveLight().
     */
    public function light(string|Theme|AdaptiveTheme $theme): Theme
    {
        if (is_string($theme) && ! class_exists($theme)) {
            throw new \InvalidArgumentException(sprintf('Theme class [%s] does not exist.', $theme));
        }

        /** @var class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme $theme */
        return $this->resolveLight($theme);
    }

    /**
     * @deprecated Use resolveDark().
     */
    public function dark(string|Theme|AdaptiveTheme $theme): ?Theme
    {
        if (is_string($theme) && ! class_exists($theme)) {
            throw new \InvalidArgumentException(sprintf('Theme class [%s] does not exist.', $theme));
        }

        /** @var class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme $theme */
        return $this->resolveDark($theme);
    }
}
