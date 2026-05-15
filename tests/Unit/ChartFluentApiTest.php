<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\LineChart;
use Orchid\Charts\Renderers\Renderer;
use Orchid\Charts\StyledChart;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgDocument;
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

    public function test_dataset_accepts_formatter_as_third_argument_without_color(): void
    {
        $chart = LineChart::make()
            ->labels(['Jan'])
            ->dataset('Visitors', [172], static fn (int|float $value): string => $value.'k');

        $dataset = $chart->data()->datasets[0];

        self::assertNull($dataset->color);
        self::assertSame('172k', $dataset->formatValue(172));
    }

    public function test_dataset_accepts_explicit_color_and_formatter_together(): void
    {
        $chart = LineChart::make()
            ->labels(['Jan'])
            ->dataset('Visitors', [172], '#2563eb', static fn (int|float $value): string => '$'.$value);

        $dataset = $chart->data()->datasets[0];

        self::assertSame('#2563eb', $dataset->color);
        self::assertSame('$172', $dataset->formatValue(172));
    }

    public function test_palette_prefers_explicit_colors_over_theme_palette(): void
    {
        $chart = LineChart::make()
            ->labels(['A'])
            ->dataset('One', [1])
            ->colors(['#123456'])
            ->theme(DarkTheme::class);

        self::assertSame(['#123456'], $chart->palette());
    }

    public function test_smooth_option_can_be_explicitly_disabled(): void
    {
        $chart = LineChart::make()->smooth(false);

        self::assertArrayHasKey('smooth', $chart->options());
        self::assertFalse($chart->options()['smooth']);
    }

    public function test_width_and_height_are_clamped_to_minimum_of_one(): void
    {
        $chart = LineChart::make()->width(0)->height(-10);

        self::assertSame(1, $chart->widthValue());
        self::assertSame(1, $chart->heightValue());
    }

    public function test_option_method_is_public_and_sets_custom_option(): void
    {
        $chart = LineChart::make()->option('legend', false);

        self::assertFalse($chart->options()['legend']);
    }

    public function test_document_returns_svg_document_instance(): void
    {
        $document = LineChart::make()
            ->labels(['A'])
            ->dataset('One', [1])
            ->document();

        self::assertInstanceOf(SvgDocument::class, $document);
    }

    public function test_second_renderer_assignment_overrides_previous_renderer_instance(): void
    {
        $first = new class implements Renderer
        {
            public function render(StyledChart $chart): SvgDocument
            {
                return new SvgDocument(100, 50, [Text::make('first', 10, 20)]);
            }
        };
        $second = new class implements Renderer
        {
            public function render(StyledChart $chart): SvgDocument
            {
                return new SvgDocument(100, 50, [Text::make('second', 10, 20)]);
            }
        };

        $svg = LineChart::make()
            ->labels(['A'])
            ->dataset('One', [1])
            ->renderer($first)
            ->renderer($second)
            ->render();

        self::assertStringContainsString('second', $svg);
        self::assertStringNotContainsString('first', $svg);
    }
}
