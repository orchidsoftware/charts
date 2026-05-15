<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Axis;

final readonly class PaddingCalculator
{
    /**
     * Calculate the drawable plot area for chart dimensions.
     */
    public function plotArea(int $width, int $height, bool $axis = true): PlotArea
    {
        if (! $axis) {
            $padding = 16;

            return new PlotArea($padding, $padding, max(1, $width - ($padding * 2)), max(1, $height - ($padding * 2)));
        }

        return new PlotArea(56, 24, max(1, $width - 80), max(1, $height - 72));
    }
}
