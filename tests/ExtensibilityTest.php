<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\LineChart;
use Orchid\Charts\Renderers\Renderer;
use Orchid\Charts\StyledChart;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgDocument;
use Orchid\Charts\Theme\Theme;
use PHPUnit\Framework\TestCase;

final class ExtensibilityTest extends TestCase
{
    public function test_custom_theme_can_be_used(): void
    {
        $svg = LineChart::make()
            ->labels(['A'])
            ->dataset('One', [1])
            ->theme(new class implements Theme
            {
                public function colors(): array
                {
                    return ['#111111'];
                }

                public function backgroundColor(): string
                {
                    return '#eeeeee';
                }

                public function gridColor(): string
                {
                    return '#dddddd';
                }

                public function textColor(): string
                {
                    return '#222222';
                }

                public function axisColor(): string
                {
                    return '#333333';
                }

                public function fontFamily(): string
                {
                    return 'Inter, sans-serif';
                }
            })
            ->render();

        self::assertStringContainsString('background:var(--chart-bg)', $svg);
        self::assertStringContainsString('--chart-bg:#eeeeee', $svg);
        self::assertStringContainsString('--chart-grid:#dddddd', $svg);
        self::assertStringContainsString('--chart-font-family:Inter, sans-serif', $svg);
    }

    public function test_custom_renderer_can_be_injected(): void
    {
        $chart = LineChart::make()
            ->labels(['A'])
            ->dataset('One', [1])
            ->renderer(new class implements Renderer
            {
                public function render(StyledChart $chart): SvgDocument
                {
                    return new SvgDocument(100, 50, [Text::make('custom', 10, 20)]);
                }
            });

        self::assertStringContainsString('custom', $chart->render());
    }
}
