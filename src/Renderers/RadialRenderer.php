<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers;

use Orchid\Charts\Renderers\Tooltip\Point2D;
use Orchid\Charts\Renderers\Tooltip\TooltipBounds;
use Orchid\Charts\Renderers\Tooltip\TooltipContent;
use Orchid\Charts\Renderers\Tooltip\TooltipPanelLayout;
use Orchid\Charts\StyledChart;
use Orchid\Charts\Support\Precision;
use Orchid\Charts\SVG\Elements\Circle;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Path;
use Orchid\Charts\SVG\SvgDocument;

readonly class RadialRenderer extends AbstractRenderer implements Renderer
{
    private const float PANEL_WIDTH = 140.0;

    private const float PANEL_HEIGHT = 58.0;

    /**
     * Render radial charts into an SVG document.
     */
    public function render(StyledChart $chart): SvgDocument
    {
        $chart->data()->ensureDatasets();
        $dataset = $chart->data()->firstDataset();
        $values = $dataset->values;
        $total = array_sum(array_map(static fn (int|float $value): float => abs((float) $value), $values));
        $cx = $chart->widthValue() / 2;
        $cy = $chart->heightValue() / 2;
        $radius = min($chart->widthValue(), $chart->heightValue()) / 2 - 24;
        $angle = -90.0;
        $sliceChildren = [];
        $hoverSlots = [];

        foreach ($values as $index => $value) {
            $portion = $total <= 0 ? 0 : abs((float) $value) / $total;
            $next = $angle + ($portion * 360);
            $arc = $this->arc($cx, $cy, $radius, $angle, $next, $this->isDonut() ? $radius * .58 : 0);
            $sliceChildren[] = Path::make($arc, [
                'class' => 'chart-slice',
                'fill' => $this->color($chart, $index),
                'data-label' => $chart->data()->label($index),
            ]);
            $anchor = $this->point($cx, $cy, $radius + 8, $angle + (($next - $angle) / 2));
            $tooltip = TooltipPanelLayout::fromAnchor(
                anchorX: $anchor->x,
                preferredY: $anchor->y - self::PANEL_HEIGHT - 10.0,
                panelWidth: self::PANEL_WIDTH,
                panelHeight: self::PANEL_HEIGHT,
                bounds: new TooltipBounds(8.0, $chart->widthValue() - 8.0, 8.0, $chart->heightValue() - 20.0),
            )->toTooltipGroup(new TooltipContent(
                $chart->data()->label($index),
                $this->formatPercentage($portion),
                $dataset->formatValue($value),
                $this->color($chart, $index),
            ));
            $hoverSlots[] = new Group([
                Path::make($arc, ['class' => 'chart-hover-target chart-radial-target']),
                $tooltip,
            ], ['class' => 'chart-hover-slot chart-radial-slot']);
            $angle = $next;
        }

        $elements = [new Group($sliceChildren, ['class' => 'chart-radial-layer'])];
        if ($this->isDonut()) {
            $elements[] = Circle::make($cx, $cy, $radius * .48, ['fill' => $this->background()]);
        }

        $elements[] = new Group($hoverSlots, ['class' => 'chart-radial-hover-layer']);

        return new SvgDocument($chart->widthValue(), $chart->heightValue(), $elements, $this->css($chart), $this->background());
    }

    /**
     * Format a value as a percentage of the total.
     */
    private function formatPercentage(float $portion): string
    {
        return Precision::plain($portion * 100).'%';
    }

    /**
     * Build an SVG arc path for the given angles.
     */
    private function arc(float $cx, float $cy, float $r, float $start, float $end, float $inner): string
    {
        $large = ($end - $start) > 180 ? 1 : 0;
        $startPoint = $this->point($cx, $cy, $r, $start);
        $endPoint = $this->point($cx, $cy, $r, $end);

        if ($inner <= 0) {
            return sprintf(
                'M %s %s L %s %s A %s %s 0 %d 1 %s %s Z',
                Precision::fixed($cx),
                Precision::fixed($cy),
                Precision::fixed($startPoint->x),
                Precision::fixed($startPoint->y),
                Precision::fixed($r),
                Precision::fixed($r),
                $large,
                Precision::fixed($endPoint->x),
                Precision::fixed($endPoint->y),
            );
        }

        $innerStart = $this->point($cx, $cy, $inner, $start);
        $innerEnd = $this->point($cx, $cy, $inner, $end);

        return sprintf(
            'M %s %s A %s %s 0 %d 1 %s %s L %s %s A %s %s 0 %d 0 %s %s Z',
            Precision::fixed($startPoint->x),
            Precision::fixed($startPoint->y),
            Precision::fixed($r),
            Precision::fixed($r),
            $large,
            Precision::fixed($endPoint->x),
            Precision::fixed($endPoint->y),
            Precision::fixed($innerEnd->x),
            Precision::fixed($innerEnd->y),
            Precision::fixed($inner),
            Precision::fixed($inner),
            $large,
            Precision::fixed($innerStart->x),
            Precision::fixed($innerStart->y),
        );
    }

    /**
     * Calculate cartesian coordinates on a circle.
     */
    private function point(float $cx, float $cy, float $r, float $angle): Point2D
    {
        $rad = deg2rad($angle);

        return new Point2D($cx + ($r * cos($rad)), $cy + ($r * sin($rad)));
    }

    /**
     * Determine whether the renderer should draw an inner donut hole.
     */
    protected function isDonut(): bool
    {
        return false;
    }
}
