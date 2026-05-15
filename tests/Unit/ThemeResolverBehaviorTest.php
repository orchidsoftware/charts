<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Theme\DarkTheme;
use Orchid\Charts\Theme\LightTheme;
use Orchid\Charts\Theme\ThemeResolver;
use Orchid\Charts\Theme\Themes;
use PHPUnit\Framework\TestCase;

final class ThemeResolverBehaviorTest extends TestCase
{
    public function test_resolve_light_returns_theme_instance_as_is(): void
    {
        $resolver = new ThemeResolver;
        $light = new LightTheme;

        self::assertSame($light, $resolver->resolveLight($light));
    }

    public function test_resolve_light_instantiates_theme_from_class_name(): void
    {
        $resolver = new ThemeResolver;

        self::assertInstanceOf(LightTheme::class, $resolver->resolveLight(LightTheme::class));
    }

    public function test_resolve_light_uses_light_theme_from_adaptive_container(): void
    {
        $resolver = new ThemeResolver;
        $themes = new Themes(new LightTheme, new DarkTheme);

        self::assertInstanceOf(LightTheme::class, $resolver->resolveLight($themes));
    }

    public function test_resolve_dark_uses_dark_theme_from_adaptive_container(): void
    {
        $resolver = new ThemeResolver;
        $themes = new Themes(new LightTheme, new DarkTheme);

        self::assertInstanceOf(DarkTheme::class, $resolver->resolveDark($themes));
        self::assertInstanceOf(DarkTheme::class, $resolver->resolveDark(Themes::class));
    }

    public function test_resolve_dark_returns_null_for_non_adaptive_theme(): void
    {
        $resolver = new ThemeResolver;

        self::assertNull($resolver->resolveDark(new LightTheme));
        self::assertNull($resolver->resolveDark(LightTheme::class));
    }
}
