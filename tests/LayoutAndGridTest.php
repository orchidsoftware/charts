<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Axis\AxisTicks;
use Orchid\Charts\Grid\GridLines;
use Orchid\Charts\Layout\LinearScale;
use Orchid\Charts\Layout\PaddingCalculator;
use PHPUnit\Framework\TestCase;

final class LayoutAndGridTest extends TestCase
{
    public function test_padding_calculator_creates_axis_plot_area(): void
    {
        $area = (new PaddingCalculator)->plotArea(800, 300);

        self::assertSame(56, $area->x);
        self::assertSame(24, $area->y);
        self::assertSame(720, $area->width);
        self::assertSame(228, $area->height);
    }

    public function test_axis_ticks_and_grid_lines_are_derived_from_scale(): void
    {
        $area = (new PaddingCalculator)->plotArea(320, 160);
        $scale = LinearScale::fromValues([1, 2, 3], $area);
        $ticks = (new AxisTicks)->fromScale($scale, 3);
        $lines = (new GridLines)->horizontal($area, $ticks);

        self::assertCount(3, $ticks);
        self::assertCount(3, $lines);
        self::assertSame((float) $area->x, $lines[0]->x1);
        self::assertSame((float) $area->right(), $lines[0]->x2);
    }
}
