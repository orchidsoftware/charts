<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\BarChart;
use Orchid\Charts\DonutChart;
use Orchid\Charts\LineChart;
use Orchid\Charts\PercentageChart;
use Orchid\Charts\PieChart;
use Orchid\Charts\Renderers\Tooltip\TooltipBounds;
use Orchid\Charts\Renderers\Tooltip\TooltipContent;
use Orchid\Charts\Renderers\Tooltip\TooltipPanelLayout;
use PHPUnit\Framework\TestCase;

final class RendererOutputDeterminismTest extends TestCase
{
    public function test_line_chart_smooth_render_output_hash_is_stable(): void
    {
        $svg = LineChart::make()
            ->labels(['January revenue report', 'February revenue report', 'March revenue report'])
            ->dataset('Sales', [120, 340, 280], '#2563eb')
            ->dataset('Profit', [40, 120, 100], '#16a34a')
            ->width(640)
            ->height(260)
            ->smooth(true)
            ->render();

        self::assertSame('1d1f5482a4c0cb87fd4588c2f1627285b338ac9cb5bcf35966d6084bf36d0514', hash('sha256', $svg));
    }

    public function test_line_chart_polyline_render_output_hash_is_stable(): void
    {
        $svg = LineChart::make()
            ->labels(['Alpha', 'Beta', 'Gamma', 'Delta'])
            ->dataset('Series', [3, -2, 5, 1], '#9333ea')
            ->width(420)
            ->height(220)
            ->smooth(false)
            ->render();

        self::assertSame('2fe69d9eaa1ef19b72fd50449c66da99c5c035b170edc0ee7b8c00e2b9b2098c', hash('sha256', $svg));
    }

    public function test_bar_chart_render_output_hash_is_stable(): void
    {
        $svg = BarChart::make()
            ->labels(['Q1', 'Q2', 'Q3'])
            ->dataset('North', [10, -5, 12], '#f97316')
            ->dataset('South', [7, 8, -3], '#0ea5e9')
            ->width(500)
            ->height(240)
            ->render();

        self::assertSame('4f26e17c739aca7932bdb332308571424e95db9d5b66e6196d5bd19418e1788d', hash('sha256', $svg));
    }

    public function test_bar_chart_with_dense_series_keeps_minimum_bar_width_stable(): void
    {
        $svg = BarChart::make()
            ->labels(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])
            ->dataset('d1', [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
            ->dataset('d2', [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
            ->dataset('d3', [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
            ->dataset('d4', [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
            ->dataset('d5', [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
            ->width(120)
            ->height(160)
            ->render();

        self::assertSame('d866f6199a8815d82e8cc707fbb35201d0b51f42bb7541fc4c080dddb512ae67', hash('sha256', $svg));
    }

    public function test_pie_chart_render_output_hash_is_stable(): void
    {
        $svg = PieChart::make()
            ->labels(['Desktop', 'Mobile', 'Tablet'])
            ->dataset('Traffic', [58, 35, 7])
            ->width(420)
            ->height(220)
            ->render();

        self::assertSame('7e72dcfeb26a79450c74703e680ce727dd69c57b3986c40232e05cdd71c2b934', hash('sha256', $svg));
    }

    public function test_donut_chart_render_output_hash_is_stable(): void
    {
        $svg = DonutChart::make()
            ->labels(['Direct', 'Search', 'Referral'])
            ->dataset('Channels', [45, 40, 15])
            ->width(420)
            ->height(220)
            ->render();

        self::assertSame('8ce7d1be72238c99c32ba83b55c5fbb2b51aa83f938b78a25e1523eca65a6d97', hash('sha256', $svg));
    }

    public function test_percentage_chart_render_output_hash_is_stable(): void
    {
        $svg = PercentageChart::make()
            ->labels(['Done', 'In progress', 'Backlog'])
            ->dataset('Sprint', [55, 30, 15])
            ->width(500)
            ->height(200)
            ->render();

        self::assertSame('a9df9b5f4a68c9cc94a962fe8641214ce43248eac80f5a35584596267384ba64', hash('sha256', $svg));
    }

    public function test_line_chart_axis_label_wrapping_boundary_output_hash_is_stable(): void
    {
        $svg = LineChart::make()
            ->smooth(false)
            ->labels(['ABCDEFG', 'XYZ'])
            ->dataset('Series', [1, 2])
            ->width(135)
            ->height(160)
            ->render();

        self::assertSame('12bca708e83d5249835be52c3cfa64c00cb5a1d517453490f6a5097849c9fc0f', hash('sha256', $svg));
    }

    public function test_line_chart_tooltip_label_wrapping_output_hash_is_stable(): void
    {
        $svg = LineChart::make()
            ->labels(['Alpha period report', 'Beta period report'])
            ->dataset('SuperLongDatasetLabelForMutation', [100, 200], '#2563eb')
            ->dataset('AnotherVeryLongSeriesLabelName', [150, 180], '#16a34a')
            ->width(520)
            ->height(260)
            ->render();

        self::assertSame('e7bcfaae82c9852eb4cde6a22929e2a87f4c387bc65ea8507daf72668b85297f', hash('sha256', $svg));
    }

    public function test_zero_total_radial_chart_output_hash_is_stable(): void
    {
        $svg = PieChart::make()
            ->labels(['A', 'B', 'C'])
            ->dataset('Share', [0, 0, 0])
            ->width(400)
            ->height(220)
            ->render();

        self::assertSame('52de3fc62060eb5301376b0d1b10e910125ccebd942d0e91334dda85f85e34a9', hash('sha256', $svg));
    }

    public function test_zero_total_percentage_chart_output_hash_is_stable(): void
    {
        $svg = PercentageChart::make()
            ->labels(['A', 'B'])
            ->dataset('Load', [0, 0])
            ->width(500)
            ->height(200)
            ->render();

        self::assertSame('e92dcda4bea46ab0a89a100ebe18cc9a971e88db756c41fe25842a5c8b08308d', hash('sha256', $svg));
    }

    public function test_tooltip_panel_layout_clamps_anchor_and_builds_expected_pointer_path(): void
    {
        $layout = TooltipPanelLayout::fromAnchor(
            anchorX: 300,
            preferredY: -30,
            panelWidth: 120,
            panelHeight: 60,
            bounds: new TooltipBounds(8, 180, 8, 120),
            pointerInset: 12,
        );

        self::assertSame(60.0, $layout->x);
        self::assertSame(8.0, $layout->y);
        self::assertSame(168.0, $layout->pointerX);
        self::assertSame('M 162.00 68.00 L 168.00 77.00 L 174.00 68.00 Z', $layout->buildPointerPath(6, 9));
    }

    public function test_tooltip_panel_group_svg_hash_is_stable(): void
    {
        $layout = TooltipPanelLayout::fromAnchor(
            anchorX: 40,
            preferredY: 10,
            panelWidth: 120,
            panelHeight: 60,
            bounds: new TooltipBounds(0, 200, 0, 200),
        );

        $svg = $layout->toTooltipGroup(new TooltipContent('A', '10%', '10', '#2563eb'))->toSvg();

        self::assertSame('bbee4a36e6ba2f4634ee589a841251b8b161419c9260a093aef362401702ea4b', hash('sha256', $svg));
    }
}
