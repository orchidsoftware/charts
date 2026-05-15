<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\SVG\Elements\Circle;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\Elements\Text;
use PHPUnit\Framework\TestCase;

final class SvgElementFactoryTest extends TestCase
{
    public function test_line_factory_rounds_coordinates_to_two_decimals(): void
    {
        $svg = Line::make(1.234, -2.345, 10.678, 20.111, ['class' => 'a'])->toSvg();

        self::assertSame('<line x1="1.23" y1="-2.35" x2="10.68" y2="20.11" class="a"/>', $svg);
    }

    public function test_rect_factory_rounds_position_and_size_to_two_decimals(): void
    {
        $svg = Rect::make(1.234, -2.345, 10.678, 20.111, ['class' => 'b'])->toSvg();

        self::assertSame('<rect x="1.23" y="-2.35" width="10.68" height="20.11" class="b"/>', $svg);
    }

    public function test_circle_factory_rounds_center_and_radius_to_two_decimals(): void
    {
        $svg = Circle::make(1.234, -2.345, 10.678, ['class' => 'c'])->toSvg();

        self::assertSame('<circle cx="1.23" cy="-2.35" r="10.68" class="c"/>', $svg);
    }

    public function test_text_factory_rounds_coordinates_and_keeps_text_content(): void
    {
        $svg = Text::make('Hi', 1.234, -2.345, ['class' => 'd'])->toSvg();

        self::assertSame('<text x="1.23" y="-2.35" class="d">Hi</text>', $svg);
    }
}
