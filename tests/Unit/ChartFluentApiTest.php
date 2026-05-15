<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\LineChart;
use Orchid\Charts\Theme\DarkTheme;
use PHPUnit\Framework\TestCase;

final class ChartFluentApiTest extends TestCase
{
    public function test_fluent_builder_is_immutable(): void
    {
        $base = LineChart::make();
        $sized = $base->width(640)->height(240);

        self::assertNotSame($base, $sized);
        self::assertSame(800, $base->widthValue());
        self::assertSame(300, $base->heightValue());
        self::assertSame(640, $sized->widthValue());
        self::assertSame(240, $sized->heightValue());
    }

    public function test_dataset_accepts_formatter_as_third_argument(): void
    {
        $chart = LineChart::make()
            ->labels(['Jan'])
            ->dataset('Visitors', [172], static fn (int|float $value): string => $value.'k');

        $dataset = $chart->data()->datasets[0];

        self::assertNull($dataset->color);
        self::assertSame('172k', $dataset->formatValue(172));
    }

    public function test_dataset_accepts_color_and_formatter(): void
    {
        $chart = LineChart::make()
            ->labels(['Jan'])
            ->dataset('Visitors', [172], '#2563eb', static fn (int|float $value): string => '$'.$value);

        $dataset = $chart->data()->datasets[0];

        self::assertSame('#2563eb', $dataset->color);
        self::assertSame('$172', $dataset->formatValue(172));
    }

    public function test_palette_prefers_explicit_colors_over_theme_colors(): void
    {
        $chart = LineChart::make()
            ->labels(['A'])
            ->dataset('One', [1])
            ->colors(['#123456'])
            ->theme(DarkTheme::class);

        self::assertSame(['#123456'], $chart->palette());
    }

    public function test_smooth_option_can_be_disabled(): void
    {
        $chart = LineChart::make()->smooth(false);

        self::assertArrayHasKey('smooth', $chart->options());
        self::assertFalse($chart->options()['smooth']);
    }
}
