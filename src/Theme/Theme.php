<?php

declare(strict_types=1);

namespace Orchid\Charts\Theme;

interface Theme
{
    /**
     * Get the theme color palette.
     *
     * @return list<string>
     */
    public function colors(): array;

    /**
     * Get the theme background color.
     */
    public function backgroundColor(): string;

    /**
     * Get the theme grid line color.
     */
    public function gridColor(): string;

    /**
     * Get the theme text color.
     */
    public function textColor(): string;

    /**
     * Get the theme axis color.
     */
    public function axisColor(): string;

    /**
     * Get the theme font family.
     */
    public function fontFamily(): string;
}
