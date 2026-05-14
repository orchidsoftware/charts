<?php

declare(strict_types=1);

namespace Orchid\Charts\Rendering;

use Orchid\Charts\Contracts\Chart;
use Orchid\Charts\Contracts\Renderer;
use Orchid\Charts\Enums\ChartType;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\Layout\LinearScale;
use Orchid\Charts\Layout\PlotArea;
use Orchid\Charts\SVG\Elements\Circle;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Path;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgDocument;

final readonly class AxisRenderer extends AbstractRenderer implements Renderer
{
    public function render(Chart $chart): SvgDocument
    {
        $chart->data()->requireDatasets();
        $area = $this->padding()->plotArea($chart->widthValue(), $chart->heightValue());
        $values = $chart->data()->allValues();
        if ($values === []) {
            throw new InvalidChartData('Axis chart values cannot be empty.');
        }

        $scale = LinearScale::fromValues($values, $area);
        $elements = $this->grid($chart, $area, $scale);
        $labels = $chart->data()->labels;
        $count = max(1, count($labels));
        $step = $area->width / $count;
        $slotEntries = array_fill(0, count($labels), []);

        foreach ($chart->data()->datasets as $datasetIndex => $dataset) {
            $color = $dataset->color ?? $this->color($chart, $datasetIndex);
            $children = [];

            if ($chart->type() === ChartType::Bar) {
                $barWidth = max(1, ($step * .72) / max(1, count($chart->data()->datasets)));
                $zero = $scale->y(0);
                foreach ($dataset->values as $index => $value) {
                    $x = $area->x + ($index * $step) + (($step - ($barWidth * count($chart->data()->datasets))) / 2) + ($datasetIndex * $barWidth);
                    $y = $scale->y($value);
                    $barY = min($y, $zero);
                    $barHeight = max(1, abs($zero - $y));
                    $children[] = Rect::make($x, $barY, $barWidth, $barHeight, ['class' => 'chart-bar chart-series', 'fill' => $color]);
                    $slotEntries[$index][] = [
                        'label' => $dataset->label,
                        'value' => (float) $value,
                        'formattedValue' => $dataset->formatValue($value),
                        'color' => $color,
                        'type' => 'bar',
                        'x' => $x,
                        'y' => $barY,
                        'width' => $barWidth,
                        'height' => $barHeight,
                        'cx' => $x + ($barWidth / 2),
                        'cy' => $y,
                    ];
                }
            } else {
                $points = [];
                foreach ($dataset->values as $index => $value) {
                    $x = $area->x + ($index * $step) + ($step / 2);
                    $y = $scale->y($value);
                    $points[] = [$x, $y];
                    $slotEntries[$index][] = [
                        'label' => $dataset->label,
                        'value' => (float) $value,
                        'formattedValue' => $dataset->formatValue($value),
                        'color' => $color,
                        'type' => 'point',
                        'x' => $x,
                        'y' => $y,
                        'width' => 0.0,
                        'height' => 0.0,
                        'cx' => $x,
                        'cy' => $y,
                    ];
                }

                $children[] = Path::make($this->linePath($points, (bool) ($chart->options()['smooth'] ?? true)), ['class' => 'chart-series', 'stroke' => $color, 'stroke-width' => 2, 'fill' => 'none']);
                foreach ($points as [$x, $y]) {
                    $children[] = Circle::make($x, $y, 3, ['class' => 'chart-point', 'fill' => $color, 'stroke' => '#fff']);
                }
            }

            $elements[] = new Group($children, ['data-label' => $dataset->label]);
        }

        foreach ($labels as $index => $label) {
            $x = $area->x + ($index * $step) + ($step / 2);
            $maxCharsPerLine = max(3, (int) floor(max(12.0, $step - 8.0) / 6.4));
            $lines = $this->wrapLines($label, $maxCharsPerLine, 2);
            foreach ($lines as $lineIndex => $line) {
                $elements[] = Text::make($line, $x, $area->bottom() + 20 + ($lineIndex * 11), ['class' => 'chart-label chart-axis-label', 'text-anchor' => 'middle']);
            }
        }

        $elements[] = $this->hoverTooltips($chart, $area, $step, $slotEntries);

        return new SvgDocument($chart->widthValue(), $chart->heightValue(), $elements, $this->css($chart), $this->background());
    }

    /**
     * @param  list<list<array{
     *     label: string,
     *     value: float,
     *     formattedValue: string,
     *     color: string,
     *     type: string,
     *     x: float,
     *     y: float,
     *     width: float,
     *     height: float,
     *     cx: float,
     *     cy: float
     * }>>  $slotEntries
     */
    private function hoverTooltips(Chart $chart, PlotArea $area, float $step, array $slotEntries): Group
    {
        $slots = [];
        $panelWidth = 236.0;
        $panelPadding = 15.0;
        $rowHeight = 44.0;
        $titleLineHeight = 12.0;
        $labelLineHeight = 11.0;

        foreach ($chart->data()->labels as $index => $label) {
            $entries = $slotEntries[$index] ?? [];
            $itemsPerRow = max(1, min(3, count($entries)));
            $rows = max(1, (int) ceil(count($entries) / $itemsPerRow));
            $itemWidth = ($panelWidth - ($panelPadding * 2)) / $itemsPerRow;
            $titleLines = $this->wrapLines($label, 18, 2);
            $titleBlockHeight = max(1, count($titleLines)) * $titleLineHeight;
            $contentTop = $area->y + 6;
            $tooltipY = $area->y + 6;
            $contentTop += 14.0 + $titleBlockHeight + 14.0;
            $panelHeight = ($contentTop - $tooltipY) + ($rows * $rowHeight) + 6.0;
            $center = $area->x + ($index * $step) + ($step / 2);
            $x = $area->x + ($index * $step);
            $tooltipX = max($area->x, min($area->right() - $panelWidth, $center - ($panelWidth / 2)));
            $pointerX = max($tooltipX + 10, min($tooltipX + $panelWidth - 10, $center));
            $overlayChildren = [
                Line::make($center, $area->y, $center, $area->bottom(), ['class' => 'chart-hover-guide']),
            ];
            $tooltipChildren = [
                Rect::make($tooltipX, $tooltipY, $panelWidth, $panelHeight, ['class' => 'chart-tooltip-panel', 'rx' => 6]),
                Path::make(sprintf('M %.2F %.2F L %.2F %.2F L %.2F %.2F Z', $pointerX - 6, $tooltipY + $panelHeight, $pointerX, $tooltipY + $panelHeight + 8, $pointerX + 6, $tooltipY + $panelHeight), ['class' => 'chart-tooltip-pointer']),
            ];

            foreach ($titleLines as $titleIndex => $titleLine) {
                $tooltipChildren[] = Text::make(
                    $titleLine,
                    $tooltipX + $panelPadding,
                    $tooltipY + 27 + ($titleIndex * $titleLineHeight),
                    ['class' => 'chart-tooltip-title']
                );
            }

            foreach ($entries as $entryIndex => $entry) {
                $row = intdiv($entryIndex, $itemsPerRow);
                $column = $entryIndex % $itemsPerRow;
                $rowTop = $contentTop + ($row * $rowHeight);
                $itemX = $tooltipX + $panelPadding + ($column * $itemWidth);
                $tooltipChildren[] = Line::make($itemX + 2, $rowTop, $itemX + $itemWidth - 2, $rowTop, ['class' => 'chart-tooltip-marker', 'stroke' => $entry['color']]);
                $tooltipChildren[] = Text::make($entry['formattedValue'], $itemX + 2, $rowTop + 15, ['class' => 'chart-tooltip-value']);
                $labelLines = $this->wrapLines($entry['label'], 12, 2);
                foreach ($labelLines as $lineIndex => $line) {
                    $tooltipChildren[] = Text::make($line, $itemX + 2, $rowTop + 28 + ($lineIndex * $labelLineHeight), ['class' => 'chart-tooltip-label']);
                }

                if ($entry['type'] === 'bar') {
                    $overlayChildren[] = Rect::make($entry['x'], $entry['y'], $entry['width'], $entry['height'], ['class' => 'chart-active-bar', 'fill' => $entry['color']]);

                    continue;
                }

                $overlayChildren[] = Circle::make($entry['cx'], $entry['cy'], 5, ['class' => 'chart-active-point', 'fill' => $entry['color']]);
            }

            $slots[] = new Group([
                Rect::make($x, $area->y, $step, $area->height, ['class' => 'chart-hover-target']),
                new Group($overlayChildren, ['class' => 'chart-hover-overlays']),
                new Group($tooltipChildren, ['class' => 'chart-tooltip']),
            ], ['class' => 'chart-hover-slot']);
        }

        return new Group($slots, ['class' => 'chart-hover-layer']);
    }

    /**
     * @return list<string>
     */
    private function wrapLines(string $text, int $maxChars, int $maxLines): array
    {
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? $text);
        if ($text === '') {
            return [''];
        }

        $words = explode(' ', $text);
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            while (strlen($word) > $maxChars) {
                $chunk = substr($word, 0, $maxChars);
                $word = substr($word, $maxChars);
                if ($current !== '') {
                    $lines[] = $current;
                    $current = '';
                }

                $lines[] = $chunk;
            }

            $candidate = $current === '' ? $word : $current.' '.$word;
            if (strlen($candidate) <= $maxChars) {
                $current = $candidate;

                continue;
            }

            if ($current !== '') {
                $lines[] = $current;
            }

            $current = $word;
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        if (count($lines) <= $maxLines) {
            return $lines;
        }

        $trimmed = array_slice($lines, 0, $maxLines);
        $lastIndex = $maxLines - 1;
        $last = $trimmed[$lastIndex];
        $trimmed[$lastIndex] = strlen($last) >= $maxChars ? substr($last, 0, max(1, $maxChars - 1)).'…' : $last.'…';

        return array_values($trimmed);
    }

    /**
     * @param  list<array{0: float, 1: float}>  $points
     */
    private function linePath(array $points, bool $smooth): string
    {
        if ($points === []) {
            return '';
        }

        $path = ['M '.round($points[0][0], 2).' '.round($points[0][1], 2)];

        for ($i = 1, $count = count($points); $i < $count; $i++) {
            if (! $smooth) {
                $path[] = 'L '.round($points[$i][0], 2).' '.round($points[$i][1], 2);

                continue;
            }

            $previous = $points[$i - 1];
            $current = $points[$i];
            $mid = ($previous[0] + $current[0]) / 2;
            $path[] = 'C '.round($mid, 2).' '.round($previous[1], 2).' '.round($mid, 2).' '.round($current[1], 2).' '.round($current[0], 2).' '.round($current[1], 2);
        }

        return implode(' ', $path);
    }
}
