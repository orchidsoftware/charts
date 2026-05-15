<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\LineChart;
use Orchid\Charts\Theme\DarkTheme;
use Orchid\Charts\Theme\LightTheme;
use Orchid\Charts\Theme\Theme;
use Orchid\Charts\Theme\Themes;
use PHPUnit\Framework\TestCase;

final class ThemeArchitectureTest extends TestCase
{
    public function test_themes_container_returns_provided_light_and_dark_instances(): void
    {
        $light = new class implements Theme
        {
            public function colors(): array
            {
                return ['#111111'];
            }

            public function backgroundColor(): string
            {
                return '#ffffff';
            }

            public function gridColor(): string
            {
                return '#eeeeee';
            }

            public function textColor(): string
            {
                return '#000000';
            }

            public function axisColor(): string
            {
                return '#999999';
            }

            public function fontFamily(): string
            {
                return 'LightStack';
            }
        };

        $dark = new class implements Theme
        {
            public function colors(): array
            {
                return ['#222222'];
            }

            public function backgroundColor(): string
            {
                return '#000000';
            }

            public function gridColor(): string
            {
                return '#222222';
            }

            public function textColor(): string
            {
                return '#ffffff';
            }

            public function axisColor(): string
            {
                return '#555555';
            }

            public function fontFamily(): string
            {
                return 'DarkStack';
            }
        };

        $themes = new Themes($light, $dark);

        self::assertSame($light, $themes->light());
        self::assertSame($dark, $themes->dark());
    }

    public function test_chart_resolves_light_and_dark_theme_from_adaptive_container(): void
    {
        $chart = LineChart::make()->theme(new Themes(new LightTheme, new DarkTheme));

        self::assertInstanceOf(LightTheme::class, $chart->themeInstance());
        self::assertInstanceOf(DarkTheme::class, $chart->darkThemeInstance());
    }

    public function test_chart_has_no_dark_theme_for_single_theme(): void
    {
        $chart = LineChart::make()->theme(LightTheme::class);

        self::assertInstanceOf(LightTheme::class, $chart->themeInstance());
        self::assertNull($chart->darkThemeInstance());
    }

    public function test_default_themes_share_expected_font_stack(): void
    {
        $lightStack = (new LightTheme)->fontFamily();
        $darkStack = (new DarkTheme)->fontFamily();

        self::assertSame($lightStack, $darkStack);
        self::assertStringContainsString('system-ui', $lightStack);
        self::assertStringContainsString('"Apple Color Emoji"', $lightStack);
    }
}
