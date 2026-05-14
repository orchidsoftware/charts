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
    private const float PANEL_WIDTH = 152.0;

    private const float PANEL_HEIGHT = 58.0;

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
                [
                    'segmentX' => $segmentX,
                    'segmentWidth' => $segment,
                    'barY' => $y,
                    'barHeight' => $barHeight,
                    'chartWidth' => $chart->widthValue(),
                    'chartHeight' => $chart->heightValue(),
                ],
                [
                    'label' => $chart->data()->labels[$index] ?? (string) $index,
                    'formattedValue' => $this->formatPercentage($portion),
                    'absoluteValue' => $dataset->formatValue($value),
                    'color' => $color,
                ],
            );
            $offset += $segment;
        }

        $elements = [new Group($children), new Group($slots, ['class' => 'chart-percentage-hover-layer'])];

        return new SvgDocument($chart->widthValue(), $chart->heightValue(), $elements, $this->css($chart), $this->background());
    }

    /**
     * @param  array{
     *     segmentX: float,
     *     segmentWidth: float,
     *     barY: float,
     *     barHeight: float,
     *     chartWidth: int,
     *     chartHeight: int
     * }  $segment
     * @param  array{
     *     label: string,
     *     formattedValue: string,
     *     absoluteValue: string,
     *     color: string
     * }  $tooltip
     */
    private function segmentTooltip(array $segment, array $tooltip): Group
    {
        $segmentX = $segment['segmentX'];
        $segmentWidth = $segment['segmentWidth'];

        if ($segmentWidth <= 0.0) {
            return new Group([], ['class' => 'chart-hover-slot']);
        }

        $barY = $segment['barY'];
        $barHeight = $segment['barHeight'];
        $chartWidth = $segment['chartWidth'];
        $chartHeight = $segment['chartHeight'];
        $label = $tooltip['label'];
        $formattedValue = $tooltip['formattedValue'];
        $absoluteValue = $tooltip['absoluteValue'];
        $color = $tooltip['color'];
        $center = $segmentX + ($segmentWidth / 2);
        $tooltipX = max(8.0, min($chartWidth - self::PANEL_WIDTH - 8.0, $center - (self::PANEL_WIDTH / 2)));
        $tooltipY = max(8.0, min(($barY - 10.0) - self::PANEL_HEIGHT, $chartHeight - self::PANEL_HEIGHT - 20.0));
        $pointerX = max($tooltipX + 10.0, min($tooltipX + self::PANEL_WIDTH - 10.0, $center));

        return new Group([
            Rect::make($segmentX, $barY, max(1.0, $segmentWidth), $barHeight, ['class' => 'chart-hover-target']),
            new Group([
                Rect::make($tooltipX, $tooltipY, self::PANEL_WIDTH, self::PANEL_HEIGHT, ['class' => 'chart-tooltip-panel', 'rx' => 6]),
                Path::make(
                    sprintf('M %.2F %.2F L %.2F %.2F L %.2F %.2F Z', $pointerX - 5, $tooltipY + self::PANEL_HEIGHT, $pointerX, $tooltipY + self::PANEL_HEIGHT + 7, $pointerX + 5, $tooltipY + self::PANEL_HEIGHT),
                    ['class' => 'chart-tooltip-pointer']
                ),
                Text::make($label, $tooltipX + 8, $tooltipY + 15, ['class' => 'chart-tooltip-title']),
                Line::make($tooltipX + 8, $tooltipY + 22, $tooltipX + self::PANEL_WIDTH - 8, $tooltipY + 22, ['class' => 'chart-tooltip-marker', 'stroke' => $color]),
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
