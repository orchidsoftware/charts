<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers;

use Orchid\Charts\Renderers\Axis\AxisTicks;
use Orchid\Charts\Renderers\Axis\GridLines;
use Orchid\Charts\Renderers\Axis\LinearScale;
use Orchid\Charts\Renderers\Axis\PaddingCalculator;
use Orchid\Charts\Renderers\Axis\PlotArea;
use Orchid\Charts\Renderers\Tooltip\LegendEntry;
use Orchid\Charts\StyledChart;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Path;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgElement;
use Orchid\Charts\Theme\Styles\CssBuilder;
use Orchid\Charts\Theme\Styles\HoverStyles;
use Orchid\Charts\Theme\Styles\ThemeStyles;

abstract readonly class AbstractRenderer
{
    /**
     * Build the base stylesheet for a rendered chart.
     */
    protected function css(StyledChart $chart, string $append = ''): string
    {
        $css = new CssBuilder;
        (new ThemeStyles($chart->themeInstance(), $chart->darkThemeInstance()))->appendTo($css);
        (new HoverStyles)->appendTo($css);

        return $css->toCss().$append;
    }

    /**
     * Create a padding calculator instance.
     */
    protected function padding(): PaddingCalculator
    {
        return new PaddingCalculator;
    }

    /**
     * Build grid lines, tick labels, and axis elements.
     *
     * @return list<SvgElement>
     */
    protected function grid(StyledChart $chart, PlotArea $area, LinearScale $scale): array
    {
        $items = [];
        $ticks = (new AxisTicks)->fromScale($scale);
        $lines = (new GridLines)->horizontal($area, $ticks);

        foreach ($lines as $index => $line) {
            $items[] = Line::make($line->x1, $line->y1, $line->x2, $line->y2, [
                'class' => 'chart-grid',
                'data-value' => $ticks[$index]->value,
            ]);
        }

        foreach ($ticks as $tick) {
            $items[] = Text::make($tick->label, $area->x - 8, $tick->position + 4, ['class' => 'chart-label', 'text-anchor' => 'end']);
        }

        $items[] = Line::make($area->x, $area->y, $area->x, $area->bottom(), ['class' => 'chart-axis']);
        $items[] = Line::make($area->x, $area->bottom(), $area->right(), $area->bottom(), ['class' => 'chart-axis']);

        return [new Group($items, ['class' => 'chart-grid-group'])];
    }

    /**
     * Resolve the series color for the given index.
     */
    protected function color(StyledChart $chart, int $index): string
    {
        $palette = $chart->palette();

        return $palette[$index % count($palette)];
    }

    /**
     * Get the chart background style token.
     */
    protected function background(): string
    {
        return 'var(--chart-bg)';
    }

    /**
     * Build the legend group for chart series.
     *
     * @param  list<LegendEntry>  $entries
     */
    protected function legend(array $entries, int $chartWidth, float $y = 16): ?Group
    {
        if (count($entries) <= 1) {
            return null;
        }

        $x = 16.0;
        $rowY = $y;
        $rowHeight = 18.0;
        $maxX = max(20.0, $chartWidth - 16.0);
        /** @var list<SvgElement> $children */
        $children = [];

        foreach ($entries as $entry) {
            $itemWidth = max(56.0, min(180.0, 24.0 + strlen($entry->label) * 7.0));
            if ($x + $itemWidth > $maxX && $x > 16.0) {
                $x = 16.0;
                $rowY += $rowHeight;
            }

            $children[] = $this->rect($x, $rowY - 8, 8, 8, ['class' => 'chart-legend-dot', 'fill' => $entry->color, 'rx' => 4]);
            $children[] = Text::make($entry->label, $x + 14, $rowY, ['class' => 'chart-legend-label']);
            $x += $itemWidth;
        }

        return new Group($children, ['class' => 'chart-legend']);
    }

    /**
     * Create an SVG line element.
     *
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    protected function line(float $x1, float $y1, float $x2, float $y2, array $attributes = []): Line
    {
        return Line::make($x1, $y1, $x2, $y2, $attributes);
    }

    /**
     * Create an SVG path element.
     *
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    protected function path(string $d, array $attributes = []): Path
    {
        return Path::make($d, $attributes);
    }

    /**
     * Create an SVG rectangle element.
     *
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    protected function rect(float $x, float $y, float $width, float $height, array $attributes = []): Rect
    {
        return Rect::make($x, $y, $width, $height, $attributes);
    }

    /**
     * Create an SVG text element.
     *
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    protected function text(string $text, float $x, float $y, array $attributes = []): Text
    {
        return Text::make($text, $x, $y, $attributes);
    }

    /**
     * Create an SVG group element.
     *
     * @param  list<SvgElement>  $children
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    protected function group(array $children, array $attributes = []): Group
    {
        return new Group($children, $attributes);
    }
}
