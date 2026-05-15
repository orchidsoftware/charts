<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\LineChart;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ChartDataValidationTest extends TestCase
{
    public function test_dataset_accepts_valid_numeric_values_and_color(): void
    {
        $dataset = new Dataset(label: 'Revenue', values: [10, 20.5], color: '#2563eb');

        self::assertSame('Revenue', $dataset->label);
        self::assertSame([10, 20.5], $dataset->values);
        self::assertSame('#2563eb', $dataset->color);
    }

    /**
     * @param  list<mixed>  $values
     */
    #[DataProvider('invalidValues')]
    public function test_dataset_rejects_non_numeric_or_non_finite_values(array $values): void
    {
        $this->expectException(InvalidChartData::class);

        new Dataset(label: 'Broken', values: $values);
    }

    /**
     * @return iterable<string, array{0: list<mixed>}>
     */
    public static function invalidValues(): iterable
    {
        yield 'empty' => [[]];
        yield 'string' => [['10']];
        yield 'nan' => [[NAN]];
        yield 'inf' => [[INF]];
    }

    public function test_chart_data_rejects_non_dataset_entries(): void
    {
        $this->expectException(InvalidChartData::class);

        new ChartData(labels: ['A'], datasets: ['not-a-dataset']);
    }

    public function test_line_chart_render_throws_when_no_dataset_is_present(): void
    {
        $this->expectException(InvalidChartData::class);

        LineChart::make()->labels(['A'])->render();
    }

    public function test_dataset_formatter_requires_scalar_or_stringable_return_value(): void
    {
        $this->expectException(InvalidChartData::class);

        LineChart::make()
            ->labels(['Jan'])
            ->dataset('Visitors', [172], static fn (): array => ['bad'])
            ->render();
    }
}
