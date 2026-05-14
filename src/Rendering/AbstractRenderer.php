<?php

declare(strict_types=1);

namespace Orchid\Charts\Rendering;

use Orchid\Charts\Axis\AxisTicks;
use Orchid\Charts\Contracts\Chart;
use Orchid\Charts\Grid\GridLines;
use Orchid\Charts\Layout\LinearScale;
use Orchid\Charts\Layout\PaddingCalculator;
use Orchid\Charts\Layout\PlotArea;
use Orchid\Charts\Styling\CssBuilder;
use Orchid\Charts\Styling\HoverStyles;
use Orchid\Charts\Styling\ThemeStyles;
use Orchid\Charts\SVG\Elements\Circle;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgElement;

abstract readonly class AbstractRenderer
{
    protected function css(Chart $chart, string $append = ''): string
    {
        $css = new CssBuilder;
        (new ThemeStyles($chart->themeInstance(), $chart->darkThemeInstance()))->appendTo($css);
        (new HoverStyles)->appendTo($css);

        return $css->toCss().$append;
    }

    protected function padding(): PaddingCalculator
    {
        return new PaddingCalculator;
    }

    /**
     * @return list<SvgElement>
     */
    protected function grid(Chart $chart, PlotArea $area, LinearScale $scale): array
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

    protected function color(Chart $chart, int $index): string
    {
        $palette = $chart->palette();

        return $palette[$index % count($palette)];
    }

    protected function background(): string
    {
        return 'var(--chart-bg)';
    }

    /**
     * @param  list<array{label: string, color: string}>  $entries
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
        $children = [];

        foreach ($entries as $entry) {
            $itemWidth = max(56.0, min(180.0, 24.0 + strlen($entry['label']) * 7.0));
            if ($x + $itemWidth > $maxX && $x > 16.0) {
                $x = 16.0;
                $rowY += $rowHeight;
            }

            $children[] = Circle::make($x + 4, $rowY - 4, 4, ['class' => 'chart-legend-dot', 'fill' => $entry['color']]);
            $children[] = Text::make($entry['label'], $x + 14, $rowY, ['class' => 'chart-legend-label']);
            $x += $itemWidth;
        }

        return new Group($children, ['class' => 'chart-legend']);
    }
}
