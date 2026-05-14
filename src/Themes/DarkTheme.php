<?php

declare(strict_types=1);

namespace Orchid\Charts\Themes;

use Orchid\Charts\Contracts\Theme;

final readonly class DarkTheme implements Theme
{
    public function colors(): array
    {
        return [
            '#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80',
            '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
            '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
            '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089',
        ];
    }

    public function backgroundColor(): string
    {
        return '#111827';
    }

    public function gridColor(): string
    {
        return '#374151';
    }

    public function textColor(): string
    {
        return '#f3f4f6';
    }

    public function axisColor(): string
    {
        return '#6b7280';
    }

    public function fontFamily(): string
    {
        return 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
    }
}
