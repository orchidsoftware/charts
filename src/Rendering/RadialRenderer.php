<?php

declare(strict_types=1);

namespace Orchid\Charts\Rendering;

use Orchid\Charts\Contracts\Chart;
use Orchid\Charts\Contracts\Renderer;
use Orchid\Charts\Enums\ChartType;
use Orchid\Charts\SVG\Elements\Circle;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Path;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgDocument;

final readonly class RadialRenderer extends AbstractRenderer implements Renderer
{
    private const float PANEL_WIDTH = 140.0;

    private const float PANEL_HEIGHT = 58.0;

    public function render(Chart $chart): SvgDocument
    {
        $chart->data()->requireDatasets();
        $dataset = $chart->data()->datasets[0];
        $values = $dataset->values;
        $labels = $chart->data()->labels;
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
            $arc = $this->arc($cx, $cy, $radius, $angle, $next, $chart->type() === ChartType::Donut ? $radius * .58 : 0);
            $sliceChildren[] = Path::make($arc, [
                'class' => 'chart-slice',
                'fill' => $this->color($chart, $index),
                'data-label' => $labels[$index] ?? (string) $index,
            ]);
            $tooltip = $this->sliceTooltip(
                [
                    'cx' => $cx,
                    'cy' => $cy,
                    'radius' => $radius,
                    'start' => $angle,
                    'end' => $next,
                    'width' => $chart->widthValue(),
                    'height' => $chart->heightValue(),
                ],
                [
                    'label' => $labels[$index] ?? (string) $index,
                    'formattedValue' => $this->formatPercentage($portion),
                    'absoluteValue' => $dataset->formatValue($value),
                    'color' => $this->color($chart, $index),
                ],
            );
            $hoverSlots[] = new Group([
                Path::make($arc, ['class' => 'chart-hover-target chart-radial-target']),
                $tooltip,
            ], ['class' => 'chart-hover-slot chart-radial-slot']);
            $angle = $next;
        }

        $elements = [new Group($sliceChildren, ['class' => 'chart-radial-layer'])];
        if ($chart->type() === ChartType::Donut) {
            $elements[] = Circle::make($cx, $cy, $radius * .48, ['fill' => $this->background()]);
        }

        $elements[] = new Group($hoverSlots, ['class' => 'chart-radial-hover-layer']);

        return new SvgDocument($chart->widthValue(), $chart->heightValue(), $elements, $this->css($chart), $this->background());
    }

    /**
     * @param  array{
     *     cx: float,
     *     cy: float,
     *     radius: float,
     *     start: float,
     *     end: float,
     *     width: int,
     *     height: int
     * }  $slice
     * @param  array{
     *     label: string,
     *     formattedValue: string,
     *     absoluteValue: string,
     *     color: string
     * }  $tooltip
     */
    private function sliceTooltip(array $slice, array $tooltip): Group
    {
        $cx = $slice['cx'];
        $cy = $slice['cy'];
        $radius = $slice['radius'];
        $start = $slice['start'];
        $end = $slice['end'];
        $width = $slice['width'];
        $height = $slice['height'];
        $label = $tooltip['label'];
        $formattedValue = $tooltip['formattedValue'];
        $absoluteValue = $tooltip['absoluteValue'];
        $color = $tooltip['color'];
        $mid = $start + (($end - $start) / 2);
        [$anchorX, $anchorY] = $this->point($cx, $cy, $radius + 8, $mid);
        $tooltipX = max(8.0, min($width - self::PANEL_WIDTH - 8.0, $anchorX - (self::PANEL_WIDTH / 2)));
        $tooltipY = max(8.0, min($height - self::PANEL_HEIGHT - 20.0, $anchorY - self::PANEL_HEIGHT - 10.0));
        $pointerX = max($tooltipX + 10.0, min($tooltipX + self::PANEL_WIDTH - 10.0, $anchorX));

        return new Group([
            Rect::make($tooltipX, $tooltipY, self::PANEL_WIDTH, self::PANEL_HEIGHT, ['class' => 'chart-tooltip-panel', 'rx' => 6]),
            Path::make(
                sprintf('M %.2F %.2F L %.2F %.2F L %.2F %.2F Z', $pointerX - 5, $tooltipY + self::PANEL_HEIGHT, $pointerX, $tooltipY + self::PANEL_HEIGHT + 7, $pointerX + 5, $tooltipY + self::PANEL_HEIGHT),
                ['class' => 'chart-tooltip-pointer']
            ),
            Text::make($label, $tooltipX + 8, $tooltipY + 15, ['class' => 'chart-tooltip-title']),
            Line::make($tooltipX + 8, $tooltipY + 22, $tooltipX + self::PANEL_WIDTH - 8, $tooltipY + 22, ['class' => 'chart-tooltip-marker', 'stroke' => $color]),
            Text::make($formattedValue, $tooltipX + 8, $tooltipY + 36, ['class' => 'chart-tooltip-value']),
            Text::make($absoluteValue, $tooltipX + 8, $tooltipY + 50, ['class' => 'chart-tooltip-meta']),
        ], ['class' => 'chart-tooltip']);
    }

    private function formatPercentage(float $portion): string
    {
        $value = round($portion * 100, 2);
        $formatted = number_format($value, 2, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted.'%';
    }

    private function arc(float $cx, float $cy, float $r, float $start, float $end, float $inner): string
    {
        $large = ($end - $start) > 180 ? 1 : 0;
        [$x1, $y1] = $this->point($cx, $cy, $r, $start);
        [$x2, $y2] = $this->point($cx, $cy, $r, $end);

        if ($inner <= 0) {
            return sprintf('M %.2F %.2F L %.2F %.2F A %.2F %.2F 0 %d 1 %.2F %.2F Z', $cx, $cy, $x1, $y1, $r, $r, $large, $x2, $y2);
        }

        [$ix1, $iy1] = $this->point($cx, $cy, $inner, $start);
        [$ix2, $iy2] = $this->point($cx, $cy, $inner, $end);

        return sprintf('M %.2F %.2F A %.2F %.2F 0 %d 1 %.2F %.2F L %.2F %.2F A %.2F %.2F 0 %d 0 %.2F %.2F Z', $x1, $y1, $r, $r, $large, $x2, $y2, $ix2, $iy2, $inner, $inner, $large, $ix1, $iy1);
    }

    /**
     * @return array{0: float, 1: float}
     */
    private function point(float $cx, float $cy, float $r, float $angle): array
    {
        $rad = deg2rad($angle);

        return [$cx + ($r * cos($rad)), $cy + ($r * sin($rad))];
    }
}
