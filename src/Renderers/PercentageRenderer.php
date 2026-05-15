<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers;

use Orchid\Charts\Renderers\Tooltip\TooltipBounds;
use Orchid\Charts\Renderers\Tooltip\TooltipContent;
use Orchid\Charts\Renderers\Tooltip\TooltipPanelLayout;
use Orchid\Charts\StyledChart;
use Orchid\Charts\Support\Precision;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\SvgDocument;

final readonly class PercentageRenderer extends AbstractRenderer implements Renderer
{
    private const float PANEL_WIDTH = 152.0;

    private const float PANEL_HEIGHT = 58.0;

    /**
     * Render percentage charts into an SVG document.
     */
    public function render(StyledChart $chart): SvgDocument
    {
        $chart->data()->ensureDatasets();
        $dataset = $chart->data()->firstDataset();
        $values = $dataset->values;
        $total = array_sum(array_map(static fn (int|float $value): float => abs((float) $value), $values));
        $x = 24.0;
        $y = $chart->heightValue() / 2 - 16;
        $width = $chart->widthValue() - 48;
        $barHeight = 32.0;
        $children = [Rect::make($x, $y, $width, $barHeight, ['rx' => 4, 'fill' => $chart->themeInstance()->gridColor()])];
        $offset = 0.0;
        $slots = [];

        foreach ($values as $index => $value) {
            $portion = $total <= 0 ? 0.0 : abs((float) $value) / $total;
            $segment = $width * $portion;
            $segmentX = $x + $offset;
            $color = $this->color($chart, $index);
            $children[] = Rect::make($segmentX, $y, $segment, $barHeight, ['class' => 'chart-bar chart-series', 'fill' => $color]);
            if ($segment <= 0.0) {
                $slots[] = new Group([], ['class' => 'chart-hover-slot']);
                $offset += $segment;

                continue;
            }

            $layout = TooltipPanelLayout::fromAnchor(
                anchorX: $segmentX + ($segment / 2),
                preferredY: ($y - 10.0) - self::PANEL_HEIGHT,
                panelWidth: self::PANEL_WIDTH,
                panelHeight: self::PANEL_HEIGHT,
                bounds: new TooltipBounds(8.0, $chart->widthValue() - 8.0, 8.0, $chart->heightValue() - 20.0),
            );
            $slots[] = new Group([
                Rect::make($segmentX, $y, max(1.0, $segment), $barHeight, ['class' => 'chart-hover-target']),
                $layout->toTooltipGroup(new TooltipContent(
                    $chart->data()->label($index),
                    $this->formatPercentage($portion),
                    $dataset->formatValue($value),
                    $color,
                )),
            ], ['class' => 'chart-hover-slot']);
            $offset += $segment;
        }

        $elements = [new Group($children), new Group($slots, ['class' => 'chart-percentage-hover-layer'])];

        return new SvgDocument($chart->widthValue(), $chart->heightValue(), $elements, $this->css($chart), $this->background());
    }

    /**
     * Format a value as a percentage of the total.
     */
    private function formatPercentage(float $portion): string
    {
        return Precision::plain($portion * 100).'%';
    }
}
