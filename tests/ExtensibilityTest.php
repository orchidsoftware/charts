<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Charts\LineChart;
use Orchid\Charts\Contracts\Chart;
use Orchid\Charts\Contracts\Renderer;
use Orchid\Charts\Contracts\Theme;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgDocument;
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
                public function render(Chart $chart): SvgDocument
                {
                    return new SvgDocument(100, 50, [Text::make($chart->type()->value, 10, 20)]);
                }
            });

        self::assertStringContainsString('line', $chart->render());
    }
}
