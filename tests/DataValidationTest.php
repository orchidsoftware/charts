<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Charts\LineChart;
use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Exceptions\InvalidChartData;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class DataValidationTest extends TestCase
{
    public function test_dataset_value_object_accepts_valid_input(): void
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
    public function test_dataset_rejects_invalid_values(array $values): void
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

    public function test_chart_data_rejects_invalid_dataset_instances(): void
    {
        $this->expectException(InvalidChartData::class);

        new ChartData(labels: ['A'], datasets: ['not-a-dataset']);
    }

    public function test_rendering_without_datasets_fails_fast(): void
    {
        $this->expectException(InvalidChartData::class);

        LineChart::make()->labels(['A'])->render();
    }

    public function test_dataset_formatter_rejects_non_scalar_values(): void
    {
        $this->expectException(InvalidChartData::class);

        LineChart::make()
            ->labels(['Jan'])
            ->dataset('Visitors', [172], static fn (): array => ['bad'])
            ->render();
    }
}
