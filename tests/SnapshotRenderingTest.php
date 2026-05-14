<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Charts\LineChart;
use Orchid\Charts\Tests\Concerns\MatchesSvgSnapshots;
use PHPUnit\Framework\TestCase;

final class SnapshotRenderingTest extends TestCase
{
    use MatchesSvgSnapshots;

    public function test_line_chart_matches_svg_snapshot(): void
    {
        $svg = LineChart::make()
            ->labels(['Jan', 'Feb', 'Mar'])
            ->dataset('Sales', [1, 3, 2])
            ->colors(['#2563eb'])
            ->width(320)
            ->height(160)
            ->render();

        $snapshot = file_get_contents(__DIR__.'/Snapshots/line_chart.svg');
        self::assertIsString($snapshot);

        $this->assertMatchesSvgSnapshot($svg, $snapshot);
    }
}
