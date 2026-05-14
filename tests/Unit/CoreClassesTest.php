<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Enums\ChartType;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\Layout\LinearScale;
use Orchid\Charts\Layout\PlotArea;
use Orchid\Charts\Rendering\AxisRenderer;
use Orchid\Charts\Rendering\PercentageRenderer;
use Orchid\Charts\Rendering\RadialRenderer;
use Orchid\Charts\Rendering\RendererFactory;
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

        self::assertSame([1, 2, 3, 4], $data->allValues());
        self::assertCount(2, $data->collection());
    }

    public function test_chart_data_requires_at_least_one_dataset(): void
    {
        $this->expectException(InvalidChartData::class);

        (new ChartData(labels: ['A'], datasets: []))->requireDatasets();
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

    public function test_renderer_factory_resolves_expected_renderer_classes(): void
    {
        $factory = new RendererFactory;

        self::assertInstanceOf(AxisRenderer::class, $factory->make(ChartType::Line));
        self::assertInstanceOf(AxisRenderer::class, $factory->make(ChartType::Bar));
        self::assertInstanceOf(RadialRenderer::class, $factory->make(ChartType::Pie));
        self::assertInstanceOf(RadialRenderer::class, $factory->make(ChartType::Donut));
        self::assertInstanceOf(PercentageRenderer::class, $factory->make(ChartType::Percentage));
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
