<?php

declare(strict_types=1);

namespace Orchid\Charts\Theme\Styles;

final readonly class HoverStyles
{
    /**
     * Append hover interaction styles to the CSS builder.
     */
    public function appendTo(CssBuilder $css): void
    {
        $css
            ->rule('.chart-series', ['transition' => 'opacity .15s ease'])
            ->rule('.chart-series:hover', ['opacity' => '.84'])
            ->rule('.chart-point:hover', ['stroke-width' => '3'])
            ->rule('.chart-slice:hover', ['opacity' => '.86'])
            ->rule('.chart-bar:hover', ['opacity' => '.8'])
            ->rule('.chart-hover-target', ['fill' => 'transparent', 'cursor' => 'crosshair', 'transition' => 'fill .12s ease'])
            ->rule('.chart-hover-slot .chart-tooltip', ['opacity' => '0', 'pointer-events' => 'none', 'transform' => 'translateY(2px)', 'transition' => 'opacity .15s ease,transform .15s ease'])
            ->rule('.chart-hover-slot .chart-active-point', ['opacity' => '0', 'transition' => 'opacity .12s ease'])
            ->rule('.chart-hover-slot .chart-active-bar', ['opacity' => '0', 'transition' => 'opacity .12s ease'])
            ->rule('.chart-hover-slot .chart-hover-guide', ['opacity' => '0', 'transition' => 'opacity .12s ease'])
            ->rule('.chart-hover-slot:hover .chart-tooltip', ['opacity' => '1', 'transform' => 'translateY(0)'])
            ->rule('.chart-hover-slot:hover .chart-active-point', ['opacity' => '1'])
            ->rule('.chart-hover-slot:hover .chart-active-bar', ['opacity' => '.26'])
            ->rule('.chart-hover-slot:hover .chart-hover-guide', ['opacity' => '1'])
            ->rule('.chart-hover-slot:hover .chart-hover-target', ['fill' => 'rgba(148,163,184,.14)']);
    }
}
