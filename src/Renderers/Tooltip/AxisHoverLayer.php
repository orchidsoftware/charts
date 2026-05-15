<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

use Orchid\Charts\Renderers\Axis\PlotArea;
use Orchid\Charts\StyledChart;
use Orchid\Charts\SVG\Elements\Circle;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Path;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgElement;

final class AxisHoverLayer
{
    /**
     * Build the hover layer for axis charts.
     *
     * @param  array<int, list<AxisHoverEntry>>  $slotEntries
     */
    public function render(StyledChart $chart, PlotArea $area, float $step, array $slotEntries): SvgElement
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
            $layout = TooltipPanelLayout::fromAnchor(
                anchorX: $center,
                preferredY: $tooltipY,
                panelWidth: $panelWidth,
                panelHeight: $panelHeight,
                bounds: new TooltipBounds($area->x, $area->right(), $tooltipY, $tooltipY + $panelHeight),
            );
            $overlayChildren = [
                $this->line($center, $area->y, $center, $area->bottom(), ['class' => 'chart-hover-guide']),
            ];
            $tooltipChildren = [
                $this->rect($layout->x, $layout->y, $layout->width, $layout->height, ['class' => 'chart-tooltip-panel', 'rx' => 6]),
                Path::make($layout->buildPointerPath(6.0, 8.0), ['class' => 'chart-tooltip-pointer']),
            ];

            foreach ($titleLines as $titleIndex => $titleLine) {
                $tooltipChildren[] = $this->text(
                    $titleLine,
                    $layout->x + $panelPadding,
                    $layout->y + 27 + ($titleIndex * $titleLineHeight),
                    ['class' => 'chart-tooltip-title']
                );
            }

            foreach ($entries as $entryIndex => $entry) {
                $row = intdiv($entryIndex, $itemsPerRow);
                $column = $entryIndex % $itemsPerRow;
                $rowTop = $contentTop + ($row * $rowHeight);
                $itemX = $layout->x + $panelPadding + ($column * $itemWidth);
                $tooltipChildren[] = $this->line($itemX + 2, $rowTop, $itemX + $itemWidth - 2, $rowTop, ['class' => 'chart-tooltip-marker', 'stroke' => $entry->tooltip->color]);
                $tooltipChildren[] = $this->text($entry->tooltip->formattedValue, $itemX + 2, $rowTop + 15, ['class' => 'chart-tooltip-value']);
                $labelLines = $this->wrapLines($entry->tooltip->label, 12, 2);
                foreach ($labelLines as $lineIndex => $line) {
                    $tooltipChildren[] = $this->text($line, $itemX + 2, $rowTop + 28 + ($lineIndex * $labelLineHeight), ['class' => 'chart-tooltip-label']);
                }

                if ($entry->isBar()) {
                    $overlayChildren[] = $this->rect($entry->x, $entry->y, $entry->width, $entry->height, ['class' => 'chart-active-bar', 'fill' => $entry->tooltip->color]);

                    continue;
                }

                $overlayChildren[] = Circle::make($entry->cx, $entry->cy, 5, ['class' => 'chart-active-point', 'fill' => $entry->tooltip->color]);
            }

            $slots[] = $this->group([
                $this->rect($x, $area->y, $step, $area->height, ['class' => 'chart-hover-target']),
                $this->group($overlayChildren, ['class' => 'chart-hover-overlays']),
                $this->group($tooltipChildren, ['class' => 'chart-tooltip']),
            ], ['class' => 'chart-hover-slot']);
        }

        return $this->group($slots, ['class' => 'chart-hover-layer']);
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

    /**
     * Create an SVG line element.
     *
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    private function line(float $x1, float $y1, float $x2, float $y2, array $attributes = []): Line
    {
        return Line::make($x1, $y1, $x2, $y2, $attributes);
    }

    /**
     * Create an SVG rectangle element.
     *
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    private function rect(float $x, float $y, float $width, float $height, array $attributes = []): Rect
    {
        return Rect::make($x, $y, $width, $height, $attributes);
    }

    /**
     * Create an SVG text element.
     *
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    private function text(string $text, float $x, float $y, array $attributes = []): Text
    {
        return Text::make($text, $x, $y, $attributes);
    }

    /**
     * Create an SVG group element.
     *
     * @param  list<SvgElement>  $children
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    private function group(array $children, array $attributes = []): Group
    {
        return new Group($children, $attributes);
    }
}
