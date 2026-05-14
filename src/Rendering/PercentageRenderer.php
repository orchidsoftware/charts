<?php

declare(strict_types=1);

namespace Orchid\Charts\Rendering;

use Orchid\Charts\Contracts\Chart;
use Orchid\Charts\Contracts\Renderer;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Path;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgDocument;

final readonly class PercentageRenderer extends AbstractRenderer implements Renderer
{
    public function render(Chart $chart): SvgDocument
    {
        $chart->data()->requireDatasets();
        $dataset = $chart->data()->datasets[0];
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
            $slots[] = $this->segmentTooltip(
                $segmentX,
                $segment,
                $y,
                $barHeight,
                $chart->widthValue(),
                $chart->heightValue(),
                $chart->data()->labels[$index] ?? (string) $index,
                $this->formatPercentage($portion),
                $dataset->formatValue($value),
                $color
            );
            $offset += $segment;
        }

        $elements = [new Group($children), new Group($slots, ['class' => 'chart-percentage-hover-layer'])];

        return new SvgDocument($chart->widthValue(), $chart->heightValue(), $elements, $this->css($chart), $this->background());
    }

    private function segmentTooltip(
        float $segmentX,
        float $segmentWidth,
        float $barY,
        float $barHeight,
        int $chartWidth,
        int $chartHeight,
        string $label,
        string $formattedValue,
        string $absoluteValue,
        string $color,
    ): Group {
        if ($segmentWidth <= 0.0) {
            return new Group([], ['class' => 'chart-hover-slot']);
        }

        $panelWidth = 152.0;
        $panelHeight = 58.0;
        $center = $segmentX + ($segmentWidth / 2);
        $tooltipX = max(8.0, min($chartWidth - $panelWidth - 8.0, $center - ($panelWidth / 2)));
        $tooltipY = max(8.0, min(($barY - 10.0) - $panelHeight, $chartHeight - $panelHeight - 20.0));
        $pointerX = max($tooltipX + 10.0, min($tooltipX + $panelWidth - 10.0, $center));

        return new Group([
            Rect::make($segmentX, $barY, max(1.0, $segmentWidth), $barHeight, ['class' => 'chart-hover-target']),
            new Group([
                Rect::make($tooltipX, $tooltipY, $panelWidth, $panelHeight, ['class' => 'chart-tooltip-panel', 'rx' => 6]),
                Path::make(
                    sprintf('M %.2F %.2F L %.2F %.2F L %.2F %.2F Z', $pointerX - 5, $tooltipY + $panelHeight, $pointerX, $tooltipY + $panelHeight + 7, $pointerX + 5, $tooltipY + $panelHeight),
                    ['class' => 'chart-tooltip-pointer']
                ),
                Text::make($label, $tooltipX + 8, $tooltipY + 15, ['class' => 'chart-tooltip-title']),
                Line::make($tooltipX + 8, $tooltipY + 22, $tooltipX + $panelWidth - 8, $tooltipY + 22, ['class' => 'chart-tooltip-marker', 'stroke' => $color]),
                Text::make($formattedValue, $tooltipX + 8, $tooltipY + 36, ['class' => 'chart-tooltip-value']),
                Text::make($absoluteValue, $tooltipX + 8, $tooltipY + 50, ['class' => 'chart-tooltip-meta']),
            ], ['class' => 'chart-tooltip']),
        ], ['class' => 'chart-hover-slot']);
    }

    private function formatPercentage(float $portion): string
    {
        $value = round($portion * 100, 2);
        $formatted = number_format($value, 2, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted.'%';
    }
}
