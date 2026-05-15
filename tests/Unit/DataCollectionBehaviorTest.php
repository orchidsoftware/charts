<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Data\DatasetCollection;
use Orchid\Charts\Exceptions\InvalidChartData;
use PHPUnit\Framework\TestCase;

final class DataCollectionBehaviorTest extends TestCase
{
    public function test_dataset_collection_preserves_order_when_counted_iterated_and_flattened(): void
    {
        $first = new Dataset('Revenue', [10, 20]);
        $second = new Dataset('Profit', [3, 5]);
        $collection = new DatasetCollection([$first, $second]);

        self::assertCount(2, $collection);
        self::assertSame([$first, $second], iterator_to_array($collection));
        self::assertSame([10, 20, 3, 5], $collection->values());
    }

    public function test_chart_data_label_falls_back_to_index_when_missing(): void
    {
        $data = new ChartData(labels: ['Jan'], datasets: [new Dataset('Sales', [1])]);

        self::assertSame('Jan', $data->label(0));
        self::assertSame('5', $data->label(5));
    }

    public function test_chart_data_rejects_non_string_labels(): void
    {
        $this->expectException(InvalidChartData::class);

        new ChartData(labels: [1], datasets: []);
    }
}
