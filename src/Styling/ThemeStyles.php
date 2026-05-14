<?php

declare(strict_types=1);

namespace Orchid\Charts\Styling;

use Orchid\Charts\Contracts\Theme;

final readonly class ThemeStyles
{
    public function __construct(private Theme $lightTheme, private ?Theme $darkTheme = null) {}

    public function appendTo(CssBuilder $css): void
    {
        $css->raw($this->variablesRule($this->lightTheme));
        if ($this->darkTheme instanceof \Orchid\Charts\Contracts\Theme) {
            $css->raw('@media (prefers-color-scheme: dark){'.$this->variablesRule($this->darkTheme).'}');
        }

        $css
            ->rule('.chart-label', ['fill' => 'var(--chart-text)', 'font-family' => 'var(--chart-font-family)', 'font-size' => '12px', 'text-wrap' => 'balance'])
            ->rule('.chart-legend-label', ['fill' => 'var(--chart-text)', 'font-family' => 'var(--chart-font-family)', 'font-size' => '11px'])
            ->rule('.chart-tooltip-title', ['fill' => 'var(--chart-text)', 'font-family' => 'var(--chart-font-family)', 'font-size' => '11px', 'font-weight' => '600', 'letter-spacing' => '.02em', 'text-wrap' => 'balance'])
            ->rule('.chart-tooltip-value', ['fill' => 'var(--chart-text)', 'font-family' => 'var(--chart-font-family)', 'font-size' => '12px', 'font-weight' => '600', 'text-wrap' => 'balance'])
            ->rule('.chart-tooltip-label', ['fill' => 'var(--chart-text)', 'font-family' => 'var(--chart-font-family)', 'font-size' => '10px', 'font-weight' => '600', 'letter-spacing' => '.02em', 'opacity' => '.58', 'text-wrap' => 'balance'])
            ->rule('.chart-tooltip-meta', ['fill' => 'var(--chart-text)', 'font-family' => 'var(--chart-font-family)', 'font-size' => '10px', 'opacity' => '.58', 'text-wrap' => 'balance'])
            ->rule('.chart-tooltip-marker', ['stroke-width' => '3', 'stroke-linecap' => 'round'])
            ->rule('.chart-tooltip-panel', ['fill' => 'var(--chart-bg)', 'stroke' => 'var(--chart-axis)', 'stroke-width' => '1', 'filter' => 'drop-shadow(0px 1px 4px rgba(17,43,66,.1)) drop-shadow(0px 2px 6px rgba(17,43,66,.08)) drop-shadow(0px 16px 24px rgba(17,43,66,.08))'])
            ->rule('.chart-tooltip-pointer', ['fill' => 'var(--chart-bg)', 'stroke' => 'var(--chart-axis)', 'stroke-width' => '.75'])
            ->rule('.chart-hover-guide', ['stroke' => 'var(--chart-axis)', 'stroke-width' => '1', 'stroke-dasharray' => '4,3'])
            ->rule('.chart-grid', ['stroke' => 'var(--chart-grid)', 'stroke-width' => '1'])
            ->rule('.chart-axis', ['stroke' => 'var(--chart-axis)', 'stroke-width' => '1']);
    }

    private function variablesRule(Theme $theme): string
    {
        return ':root{--chart-bg:'.$theme->backgroundColor().';--chart-grid:'.$theme->gridColor().';--chart-text:'.$theme->textColor().';--chart-axis:'.$theme->axisColor().';--chart-font-family:'.$theme->fontFamily().'}';
    }
}
