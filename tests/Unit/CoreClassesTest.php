<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\BarChart;
use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\DonutChart;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\LineChart;
use Orchid\Charts\PercentageChart;
use Orchid\Charts\PieChart;
use Orchid\Charts\Renderers\Axis\LinearScale;
use Orchid\Charts\Renderers\Axis\PlotArea;
use Orchid\Charts\Support\Color;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CoreClassesTest extends TestCase
{
    public function test_chart_data_all_values_flattens_dataset_values(): void
    {
        $data = new ChartData(
            labels: ['A', 'B'],
            datasets: [
                new Dataset('One', [1, 2]),
                new Dataset('Two', [3, 4]),
            ],
        );

        self::assertSame([1, 2, 3, 4], $data->values());
        self::assertCount(2, $data->datasets());
    }

    public function test_chart_data_requires_at_least_one_dataset(): void
    {
        $this->expectException(InvalidChartData::class);

        (new ChartData(labels: ['A'], datasets: []))->ensureDatasets();
    }

    public function test_plot_area_computed_edges_are_correct(): void
    {
        $area = new PlotArea(x: 12, y: 8, width: 100, height: 50);

        self::assertSame(112, $area->right());
        self::assertSame(58, $area->bottom());
    }

    /**
     * @param  non-empty-list<int|float>  $values
     */
    #[DataProvider('scaleCases')]
    public function test_linear_scale_handles_common_ranges(array $values, float $expectedMin, float $expectedMax): void
    {
        $scale = LinearScale::fromValues($values, new PlotArea(0, 0, 200, 100));

        self::assertSame($expectedMin, $scale->min);
        self::assertSame($expectedMax, $scale->max);
    }

    /**
     * @return iterable<string, array{0: non-empty-list<int|float>, 1: float, 2: float}>
     */
    public static function scaleCases(): iterable
    {
        yield 'all-positive-values-include-zero' => [[10, 20], 0.0, 20.0];
        yield 'all-negative-values-include-zero' => [[-10, -2], -10.0, 0.0];
        yield 'flat-positive-range-includes-zero' => [[5, 5], 0.0, 5.0];
        yield 'flat-zero-range-is-expanded' => [[0, 0], -1.0, 1.0];
    }

    public function test_chart_classes_use_expected_default_rendering_strategy(): void
    {
        $line = LineChart::make()->labels(['A'])->dataset('One', [1])->render();
        $bar = BarChart::make()->labels(['A'])->dataset('One', [1])->render();
        $pie = PieChart::make()->labels(['A'])->dataset('One', [1])->render();
        $donut = DonutChart::make()->labels(['A'])->dataset('One', [1])->render();
        $percentage = PercentageChart::make()->labels(['A'])->dataset('One', [1])->render();

        self::assertStringContainsString('class="chart-point"', $line);
        self::assertStringNotContainsString('class="chart-point"', $bar);
        self::assertStringContainsString('class="chart-bar chart-series"', $bar);
        self::assertStringNotContainsString('<circle cx="400" cy="150"', $pie);
        self::assertStringContainsString('<circle cx="400" cy="150"', $donut);
        self::assertStringContainsString('chart-percentage-hover-layer', $percentage);
    }

    public function test_color_validation_accepts_and_rejects_expected_formats(): void
    {
        self::assertTrue(Color::isValid('#fff'));
        self::assertTrue(Color::isValid('#2563eb'));
        self::assertTrue(Color::isValid('rgb(37, 99, 235)'));
        self::assertTrue(Color::isValid('rgba(37, 99, 235, 0.5)'));
        self::assertFalse(Color::isValid('hsl(1, 2%, 3%)'));
        self::assertFalse(Color::isValid('blue-ish'));
    }
}
