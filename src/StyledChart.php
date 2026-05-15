<?php

declare(strict_types=1);

namespace Orchid\Charts;

use Orchid\Charts\Theme\Theme;

interface StyledChart extends ChartContract
{
    /**
     * Resolve the active light theme instance.
     */
    public function themeInstance(): Theme;

    /**
     * Resolve the active dark theme instance when available.
     */
    public function darkThemeInstance(): ?Theme;

    /**
     * Get the color palette used for rendering.
     *
     * @return list<string>
     */
    public function palette(): array;

    /**
     * Get all chart options.
     *
     * @return array<string, mixed>
     */
    public function options(): array;

    /**
     * Determine whether line smoothing is enabled.
     */
    public function isSmoothEnabled(): bool;
}
