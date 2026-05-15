<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Renderers\AxisRenderer;
use Orchid\Charts\Renderers\Tooltip\AxisHoverLayer;
use PHPUnit\Framework\TestCase;

final class TextWrappingRulesTest extends TestCase
{
    public function test_axis_renderer_wrap_lines_returns_single_empty_line_for_blank_text(): void
    {
        $wrapped = $this->invokePrivate(new AxisRenderer, 'wrapLines', ['   ', 3, 2]);

        self::assertSame([''], $wrapped);
    }

    public function test_axis_renderer_wrap_lines_truncates_last_line_with_ellipsis_when_exceeding_limit(): void
    {
        $wrapped = $this->invokePrivate(new AxisRenderer, 'wrapLines', ['ABCDEFG', 3, 2]);

        self::assertSame(['ABC', 'DE…'], $wrapped);
    }

    public function test_axis_hover_layer_wrap_lines_returns_single_empty_line_for_blank_text(): void
    {
        $wrapped = $this->invokePrivate(new AxisHoverLayer, 'wrapLines', ['   ', 12, 2]);

        self::assertSame([''], $wrapped);
    }

    public function test_axis_hover_layer_wrap_lines_truncates_last_line_with_ellipsis_when_exceeding_limit(): void
    {
        $wrapped = $this->invokePrivate(new AxisHoverLayer, 'wrapLines', ['SuperLongDatasetLabelForMutation', 12, 2]);

        self::assertSame(['SuperLongDat', 'asetLabelFo…'], $wrapped);
    }

    /**
     * @param  list<mixed>  $arguments
     */
    private function invokePrivate(object $target, string $method, array $arguments): mixed
    {
        $invoker = \Closure::bind(
            fn (array $args) => $this->{$method}(...$args),
            $target,
            $target
        );

        return $invoker($arguments);
    }
}
