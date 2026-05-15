<?php

declare(strict_types=1);

namespace Orchid\Charts\Theme;

final readonly class LightTheme implements Theme
{
    /**
     * Get the theme color palette.
     */
    public function colors(): array
    {
        return [
            '#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80',
            '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
            '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
            '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089',
        ];
    }

    /**
     * Get the theme background color.
     */
    public function backgroundColor(): string
    {
        return '#ffffff';
    }

    /**
     * Get the theme grid line color.
     */
    public function gridColor(): string
    {
        return '#e5e7eb';
    }

    /**
     * Get the theme text color.
     */
    public function textColor(): string
    {
        return '#374151';
    }

    /**
     * Get the theme axis color.
     */
    public function axisColor(): string
    {
        return '#9ca3af';
    }

    /**
     * Get the theme font family.
     */
    public function fontFamily(): string
    {
        return 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
    }
}
