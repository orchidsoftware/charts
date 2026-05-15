<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\BarChart;
use Orchid\Charts\DonutChart;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\LineChart;
use Orchid\Charts\PercentageChart;
use Orchid\Charts\PieChart;
use Orchid\Charts\Theme\DarkTheme;
use PHPUnit\Framework\TestCase;

final class ChartRenderingIntegrationTest extends TestCase
{
    public function test_line_chart_renders_sanitized_svg_without_script_handlers(): void
    {
        $svg = LineChart::make()
            ->labels(['Jan', 'Feb', 'Mar'])
            ->dataset('Sales', [120, 340, 280])
            ->colors(['#2563eb'])
            ->width(800)
            ->height(300)
            ->smooth()
            ->theme(DarkTheme::class)
            ->render();

        self::assertStringStartsWith('<svg ', $svg);
        self::assertStringContainsString('<style>', $svg);
        self::assertStringContainsString('C ', $svg);
        self::assertStringNotContainsString('<script', $svg);
        self::assertStringNotContainsString('onmouseover', $svg);
        self::assertStringNotContainsString('onclick', $svg);
    }

    public function test_default_theme_emits_light_and_dark_css_variables(): void
    {
        $svg = LineChart::make()
            ->labels(['Jan'])
            ->dataset('Sales', [1])
            ->render();

        self::assertStringContainsString('background:var(--chart-bg)', $svg);
        self::assertStringContainsString('--chart-bg:#ffffff', $svg);
        self::assertStringContainsString('--chart-font-family:system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', $svg);
        self::assertStringContainsString('font-family:var(--chart-font-family)', $svg);
        self::assertStringContainsString('@media (prefers-color-scheme: dark)', $svg);
        self::assertStringContainsString('--chart-bg:#111827', $svg);
    }

    public function test_all_supported_chart_types_render_valid_svg_root(): void
    {
        $charts = [
            BarChart::make()->labels(['A', 'B'])->dataset('Bars', [1, 3]),
            PieChart::make()->labels(['A', 'B'])->dataset('Pie', [1, 3]),
            DonutChart::make()->labels(['A', 'B'])->dataset('Donut', [1, 3]),
            PercentageChart::make()->labels(['A', 'B'])->dataset('Share', [1, 3]),
        ];

        foreach ($charts as $chart) {
            $svg = (string) $chart;
            self::assertStringStartsWith('<svg ', $svg);
            self::assertStringContainsString('</svg>', $svg);
        }
    }

    public function test_render_throws_when_dataset_value_count_does_not_match_labels(): void
    {
        $this->expectException(InvalidChartData::class);

        LineChart::make()
            ->labels(['Jan'])
            ->dataset('Sales', [1, 2])
            ->render();
    }

    public function test_chart_rejects_invalid_custom_palette_color(): void
    {
        $this->expectException(InvalidChartData::class);

        BarChart::make()->colors(['blue-ish']);
    }

    public function test_axis_hover_layer_tooltip_and_active_point_render_without_javascript(): void
    {
        $svg = LineChart::make()
            ->labels(['Jan', 'Feb', 'Mar'])
            ->dataset('Sales', [120, 340, 280], '#2563eb')
            ->dataset('Profit', [40, 120, 100], '#16a34a')
            ->render();

        self::assertStringContainsString('class="chart-hover-layer"', $svg);
        self::assertStringContainsString('class="chart-tooltip"', $svg);
        self::assertStringContainsString('class="chart-hover-guide"', $svg);
        self::assertStringContainsString('class="chart-active-point"', $svg);
        self::assertStringContainsString('.chart-hover-slot:hover .chart-active-point{opacity:1}', $svg);
        self::assertStringNotContainsString('<script', $svg);
        self::assertStringNotContainsString('onmouseover', $svg);
    }

    public function test_dataset_formatter_output_is_rendered_in_tooltip_values(): void
    {
        $svg = LineChart::make()
            ->labels(['Jan', 'Feb'])
            ->dataset('Visitors', [172, 181], static fn (int|float $value): string => $value.' Тысяч')
            ->render();

        self::assertStringContainsString('172 Тысяч', $svg);
        self::assertStringContainsString('181 Тысяч', $svg);
    }

    public function test_long_axis_labels_are_wrapped_or_truncated_with_ellipsis(): void
    {
        $svg = LineChart::make()
            ->labels([
                'SupercalifragilisticexpialidociousLabelForJanuary',
                'PneumonoultramicroscopicsilicovolcanoconiosisLabelForFebruary',
            ])
            ->dataset('Sales', [10, 20])
            ->width(240)
            ->height(160)
            ->render();

        self::assertStringContainsString('chart-axis-label', $svg);
        self::assertStringContainsString('…', $svg);
    }

    public function test_radial_and_percentage_charts_render_css_only_tooltip_layers(): void
    {
        $pie = PieChart::make()->labels(['A', 'B'])->dataset('Share', [30, 70])->render();
        $donut = DonutChart::make()->labels(['A', 'B'])->dataset('Share', [30, 70])->render();
        $percentage = PercentageChart::make()->labels(['A', 'B'])->dataset('Share', [30, 70])->render();

        self::assertStringContainsString('class="chart-tooltip"', $pie);
        self::assertStringContainsString('class="chart-tooltip"', $donut);
        self::assertStringContainsString('class="chart-tooltip"', $percentage);
        self::assertStringContainsString('chart-hover-slot', $pie);
        self::assertStringContainsString('chart-hover-slot', $donut);
        self::assertStringContainsString('chart-hover-slot', $percentage);
        self::assertStringContainsString('chart-tooltip-meta', $pie);
        self::assertStringContainsString('chart-tooltip-meta', $donut);
        self::assertStringContainsString('chart-tooltip-meta', $percentage);
        self::assertStringNotContainsString('<script', $pie);
        self::assertStringNotContainsString('<script', $donut);
        self::assertStringNotContainsString('<script', $percentage);
        self::assertStringContainsString('30%', $pie);
        self::assertStringContainsString('70%', $donut);
        self::assertStringContainsString('70%', $percentage);
        self::assertStringContainsString('>30</text>', $pie);
        self::assertStringContainsString('>70</text>', $donut);
        self::assertStringContainsString('>70</text>', $percentage);
        self::assertStringNotContainsString('Pie chart', $pie);
        self::assertStringNotContainsString('Donut chart', $donut);
        self::assertStringNotContainsString('Percentage chart', $percentage);
    }
}
