<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers;

use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\Renderers\Axis\LinearScale;
use Orchid\Charts\Renderers\Tooltip\AxisHoverEntry;
use Orchid\Charts\Renderers\Tooltip\AxisHoverLayer;
use Orchid\Charts\Renderers\Tooltip\AxisSeriesContext;
use Orchid\Charts\Renderers\Tooltip\Point2D;
use Orchid\Charts\Renderers\Tooltip\TooltipContent;
use Orchid\Charts\StyledChart;
use Orchid\Charts\Support\Precision;
use Orchid\Charts\SVG\Elements\Circle;
use Orchid\Charts\SVG\SvgDocument;
use Orchid\Charts\SVG\SvgElement;

readonly class AxisRenderer extends AbstractRenderer implements Renderer
{
    /**
     * Render axis-based charts into an SVG document.
     */
    public function render(StyledChart $chart): SvgDocument
    {
        $chart->data()->ensureDatasets();
        $area = $this->padding()->plotArea($chart->widthValue(), $chart->heightValue());
        $values = $chart->data()->values();
        if ($values === []) {
            throw new InvalidChartData('Axis chart values cannot be empty.');
        }

        $scale = LinearScale::fromValues($values, $area);
        $elements = $this->grid($chart, $area, $scale);
        $labels = $chart->data()->labels;
        $count = max(1, count($labels));
        $step = $area->width / $count;
        /** @var array<int, list<AxisHoverEntry>> $slotEntries */
        $slotEntries = array_fill(0, count($labels), []);
        $datasetCount = count($chart->data()->datasets);

        foreach ($chart->data()->datasets as $datasetIndex => $dataset) {
            $color = $dataset->color ?? $this->color($chart, $datasetIndex);
            $context = new AxisSeriesContext($step, $area, $scale, $color, $datasetIndex, $datasetCount);
            $children = $this->renderSeries($chart, $dataset, $context, $slotEntries);

            $elements[] = $this->group($children, ['data-label' => $dataset->label]);
        }

        for ($index = 0; $index < $count; $index++) {
            $label = $chart->data()->label($index);
            $x = $area->x + ($index * $step) + ($step / 2);
            $maxCharsPerLine = max(3, (int) floor(max(12.0, $step - 8.0) / 6.4));
            foreach ($this->wrapLines($label, $maxCharsPerLine, 2) as $lineIndex => $line) {
                $elements[] = $this->text($line, $x, $area->bottom() + 20 + ($lineIndex * 11), ['class' => 'chart-label chart-axis-label', 'text-anchor' => 'middle']);
            }
        }

        $elements[] = (new AxisHoverLayer)->render($chart, $area, $step, $slotEntries);

        return new SvgDocument($chart->widthValue(), $chart->heightValue(), $elements, $this->css($chart), $this->background());
    }

    /**
     * Build bar series elements.
     *
     * @param  array<int, list<AxisHoverEntry>>  $slotEntries
     * @return list<SvgElement>
     */
    protected function renderBars(
        Dataset $dataset,
        AxisSeriesContext $context,
        array &$slotEntries,
    ): array {
        $children = [];
        $barWidth = (float) max(1, ($context->step * .72) / max(1, $context->datasetCount));
        $zero = $context->scale->y(0);

        foreach ($dataset->values as $index => $value) {
            $x = $context->area->x + ($index * $context->step) + (($context->step - ($barWidth * $context->datasetCount)) / 2) + ($context->datasetIndex * $barWidth);
            $y = $context->scale->y($value);
            $barY = min($y, $zero);
            $barHeight = (float) max(1, abs($zero - $y));
            $children[] = $this->rect($x, $barY, $barWidth, $barHeight, ['class' => 'chart-bar chart-series', 'fill' => $context->color]);
            $slotEntries[$index][] = new AxisHoverEntry(
                tooltip: new TooltipContent(
                    label: $dataset->label,
                    formattedValue: $dataset->formatValue($value),
                    absoluteValue: '',
                    color: $context->color,
                ),
                type: 'bar',
                x: $x,
                y: $barY,
                width: $barWidth,
                height: $barHeight,
                cx: $x + ($barWidth / 2),
                cy: $y,
            );
        }

        return $children;
    }

    /**
     * Build line series elements.
     *
     * @param  array<int, list<AxisHoverEntry>>  $slotEntries
     * @return list<SvgElement>
     */
    protected function renderLine(
        StyledChart $chart,
        Dataset $dataset,
        AxisSeriesContext $context,
        array &$slotEntries,
    ): array {
        $points = [];
        $children = [];

        foreach ($dataset->values as $index => $value) {
            $x = $context->area->x + ($index * $context->step) + ($context->step / 2);
            $y = $context->scale->y($value);
            $point = new Point2D($x, $y);
            $points[] = $point;
            $slotEntries[$index][] = new AxisHoverEntry(
                tooltip: new TooltipContent(
                    label: $dataset->label,
                    formattedValue: $dataset->formatValue($value),
                    absoluteValue: '',
                    color: $context->color,
                ),
                type: 'point',
                x: $x,
                y: $y,
                width: 0.0,
                height: 0.0,
                cx: $x,
                cy: $y,
            );
        }

        $children[] = $this->path($this->buildLinePath($points, $chart->isSmoothEnabled()), ['class' => 'chart-series', 'stroke' => $context->color, 'stroke-width' => 2, 'fill' => 'none']);
        foreach ($points as $point) {
            $children[] = Circle::make($point->x, $point->y, 3, ['class' => 'chart-point', 'fill' => $context->color, 'stroke' => '#fff']);
        }

        return $children;
    }

    /**
     * Build the default series elements for this renderer.
     *
     * @param  array<int, list<AxisHoverEntry>>  $slotEntries
     * @return list<SvgElement>
     */
    protected function renderSeries(
        StyledChart $chart,
        Dataset $dataset,
        AxisSeriesContext $context,
        array &$slotEntries,
    ): array {
        return $this->renderLine($chart, $dataset, $context, $slotEntries);
    }

    /**
     * Build an SVG path string for a line series.
     *
     * @param  list<Point2D>  $points
     */
    private function buildLinePath(array $points, bool $smooth): string
    {
        if ($points === []) {
            return '';
        }

        $path = ['M '.Precision::plain($points[0]->x).' '.Precision::plain($points[0]->y)];

        for ($i = 1, $count = count($points); $i < $count; $i++) {
            if (! $smooth) {
                $path[] = 'L '.Precision::plain($points[$i]->x).' '.Precision::plain($points[$i]->y);

                continue;
            }

            $previous = $points[$i - 1];
            $current = $points[$i];
            $mid = ($previous->x + $current->x) / 2;
            $path[] = 'C '.Precision::plain($mid).' '.Precision::plain($previous->y).' '.Precision::plain($mid).' '.Precision::plain($current->y).' '.Precision::plain($current->x).' '.Precision::plain($current->y);
        }

        return implode(' ', $path);
    }

    /**
     * Wrap text into a limited number of lines.
     *
     * @return list<string>
     */
    private function wrapLines(string $text, int $maxChars, int $maxLines): array
    {
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? $text);
        if ($text === '') {
            return [''];
        }

        $lines = explode("\n", wordwrap($text, $maxChars, "\n", true));

        if (count($lines) <= $maxLines) {
            return $lines;
        }

        $trimmed = array_slice($lines, 0, $maxLines);
        $lastIndex = $maxLines - 1;
        $last = $trimmed[$lastIndex];
        $trimmed[$lastIndex] = strlen($last) >= $maxChars ? substr($last, 0, max(1, $maxChars - 1)).'…' : $last.'…';

        return array_values($trimmed);
    }
}
