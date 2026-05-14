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
        $panelWidth = 140.0;
        $panelHeight = 58.0;

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
                $cx,
                $cy,
                $radius,
                $angle,
                $next,
                $chart->widthValue(),
                $chart->heightValue(),
                $labels[$index] ?? (string) $index,
                $this->formatPercentage($portion),
                $dataset->formatValue($value),
                $this->color($chart, $index),
                $panelWidth,
                $panelHeight,
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

    private function sliceTooltip(
        float $cx,
        float $cy,
        float $radius,
        float $start,
        float $end,
        int $width,
        int $height,
        string $label,
        string $formattedValue,
        string $absoluteValue,
        string $color,
        float $panelWidth,
        float $panelHeight,
    ): Group {
        $mid = $start + (($end - $start) / 2);
        [$anchorX, $anchorY] = $this->point($cx, $cy, $radius + 8, $mid);
        $tooltipX = max(8.0, min($width - $panelWidth - 8.0, $anchorX - ($panelWidth / 2)));
        $tooltipY = max(8.0, min($height - $panelHeight - 20.0, $anchorY - $panelHeight - 10.0));
        $pointerX = max($tooltipX + 10.0, min($tooltipX + $panelWidth - 10.0, $anchorX));

        return new Group([
            Rect::make($tooltipX, $tooltipY, $panelWidth, $panelHeight, ['class' => 'chart-tooltip-panel', 'rx' => 6]),
            Path::make(
                sprintf('M %.2F %.2F L %.2F %.2F L %.2F %.2F Z', $pointerX - 5, $tooltipY + $panelHeight, $pointerX, $tooltipY + $panelHeight + 7, $pointerX + 5, $tooltipY + $panelHeight),
                ['class' => 'chart-tooltip-pointer']
            ),
            Text::make($label, $tooltipX + 8, $tooltipY + 15, ['class' => 'chart-tooltip-title']),
            Line::make($tooltipX + 8, $tooltipY + 22, $tooltipX + $panelWidth - 8, $tooltipY + 22, ['class' => 'chart-tooltip-marker', 'stroke' => $color]),
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
