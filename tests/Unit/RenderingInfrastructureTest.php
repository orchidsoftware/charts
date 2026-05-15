<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests;

use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\LineChart;
use Orchid\Charts\Renderers\AbstractRenderer;
use Orchid\Charts\Renderers\Axis\LinearScale;
use Orchid\Charts\Renderers\Axis\PaddingCalculator;
use Orchid\Charts\Renderers\Axis\PlotArea;
use Orchid\Charts\Renderers\PercentageRenderer;
use Orchid\Charts\Renderers\Tooltip\LegendEntry;
use Orchid\Charts\Renderers\Tooltip\TooltipBounds;
use Orchid\Charts\Renderers\Tooltip\TooltipContent;
use Orchid\Charts\Renderers\Tooltip\TooltipPanelLayout;
use Orchid\Charts\StyledChart;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Text;
use Orchid\Charts\SVG\SvgDocument;
use Orchid\Charts\Theme\DarkTheme;
use Orchid\Charts\Theme\ThemeResolver;
use Orchid\Charts\Theme\Themes;
use PHPUnit\Framework\TestCase;

final class RenderingInfrastructureTest extends TestCase
{
    public function test_chart_data_returns_primary_accessors_for_valid_input(): void
    {
        $dataset = new Dataset('Sales', [10, 20]);
        $data = new ChartData(labels: ['Jan', 'Feb'], datasets: [$dataset]);

        self::assertSame($dataset, $data->firstDataset());
        self::assertSame('Jan', $data->label(0));
        self::assertSame([10, 20], $data->datasets()->values());
        $data->ensureDatasets();
    }

    public function test_chart_data_first_dataset_throws_when_collection_is_empty(): void
    {
        $this->expectException(InvalidChartData::class);

        (new ChartData(labels: ['Jan'], datasets: []))->firstDataset();
    }

    public function test_dataset_formats_scalar_and_stringable_values(): void
    {
        $dataset = (new Dataset('Visitors', [100]))->withColor('#2563eb');

        self::assertSame('#2563eb', $dataset->color);
        self::assertSame('100', $dataset->formatValue(100));

        $withFormatter = new Dataset(
            'Revenue',
            [12],
            null,
            static fn (int|float $value): \Stringable => new readonly class($value) implements \Stringable
            {
                public function __construct(private int|float $value) {}

                public function __toString(): string
                {
                    return '$'.$this->value;
                }
            }
        );

        self::assertSame('$12', $withFormatter->formatValue(12));
    }

    public function test_padding_calculator_uses_compact_padding_when_axis_is_disabled(): void
    {
        $area = (new PaddingCalculator)->plotArea(100, 50, false);

        self::assertSame(16, $area->x);
        self::assertSame(16, $area->y);
        self::assertSame(68, $area->width);
        self::assertSame(18, $area->height);
    }

    public function test_padding_calculator_clamps_plot_area_dimensions_to_one_for_tiny_chart_sizes(): void
    {
        $calculator = new PaddingCalculator;

        $compact = $calculator->plotArea(1, 1, false);
        $axis = $calculator->plotArea(1, 1, true);

        self::assertSame(1, $compact->width);
        self::assertSame(1, $compact->height);
        self::assertSame(1, $axis->width);
        self::assertSame(1, $axis->height);
    }

    public function test_svg_document_escapes_text_and_ignores_null_attributes(): void
    {
        $document = new SvgDocument(120, 40, [
            Text::make('A "quoted" title', 10, 20, ['data-null' => null, 'title' => 'The "best" chart']),
        ]);

        $svg = (string) $document;

        self::assertStringContainsString('<svg ', $svg);
        self::assertStringContainsString('A &quot;quoted&quot; title', $svg);
        self::assertStringContainsString('title="The &quot;best&quot; chart"', $svg);
        self::assertStringNotContainsString('data-null=', $svg);
    }

    public function test_dark_theme_palette_and_theme_resolver_main_paths(): void
    {
        $dark = new DarkTheme;
        $resolver = new ThemeResolver;
        $adaptive = new Themes(LineChart::make()->themeInstance(), $dark);

        self::assertCount(20, $dark->colors());
        self::assertSame('#111827', $dark->backgroundColor());
        self::assertSame('#374151', $dark->gridColor());
        self::assertSame('#f3f4f6', $dark->textColor());
        self::assertSame('#6b7280', $dark->axisColor());
        self::assertStringContainsString('system-ui', $dark->fontFamily());

        self::assertSame($dark, $resolver->resolveLight($dark));
        self::assertSame($dark, $resolver->resolveDark($adaptive));
        self::assertInstanceOf(DarkTheme::class, $resolver->resolveDark(Themes::class));
        self::assertNull($resolver->resolveDark(DarkTheme::class));
    }

    public function test_theme_resolver_resolve_light_throws_for_missing_class(): void
    {
        $resolver = new ThemeResolver;

        $this->expectException(\InvalidArgumentException::class);
        $resolver->resolveLight('Missing\\Theme\\Class');
    }

    public function test_theme_resolver_resolve_dark_throws_for_missing_class(): void
    {
        $resolver = new ThemeResolver;

        $this->expectException(\InvalidArgumentException::class);
        $resolver->resolveDark('Missing\\Theme\\Class');
    }

    public function test_tooltip_layout_renders_group_and_zero_total_percentage_chart_has_no_panels(): void
    {
        $layout = TooltipPanelLayout::fromAnchor(
            anchorX: 40,
            preferredY: 10,
            panelWidth: 120,
            panelHeight: 60,
            bounds: new TooltipBounds(0, 200, 0, 200),
        );
        $tooltip = new TooltipContent('A', '10%', '10', '#2563eb');

        self::assertStringContainsString('M ', $layout->buildPointerPath());
        self::assertStringContainsString('class="chart-tooltip"', $layout->toTooltipGroup($tooltip)->toSvg());

        $svg = LineChart::make()
            ->renderer(new PercentageRenderer)
            ->labels(['A', 'B'])
            ->dataset('Load', [0, 0])
            ->render();

        self::assertStringContainsString('chart-percentage-hover-layer', $svg);
        self::assertSame(0, substr_count($svg, 'class="chart-tooltip-panel"'));
    }

    public function test_line_renderer_uses_polyline_segments_when_smoothing_is_disabled(): void
    {
        $svg = LineChart::make()
            ->smooth(false)
            ->labels(['', '    '])
            ->dataset('Series', [1, 2])
            ->render();

        self::assertStringContainsString(' L ', $svg);
        self::assertStringNotContainsString(' C ', $svg);
        self::assertStringContainsString('chart-hover-layer', $svg);
    }

    public function test_abstract_renderer_builds_css_grid_and_legend_for_multiple_series(): void
    {
        $renderer = new readonly class extends AbstractRenderer
        {
            public function exposeCss(StyledChart $chart, string $append = ''): string
            {
                return $this->css($chart, $append);
            }

            public function exposeGrid(StyledChart $chart, PlotArea $area, LinearScale $scale): array
            {
                return $this->grid($chart, $area, $scale);
            }

            public function exposeColor(StyledChart $chart, int $index): string
            {
                return $this->color($chart, $index);
            }

            public function exposeBackground(): string
            {
                return $this->background();
            }

            public function exposeLegend(array $entries, int $chartWidth, float $y = 16): ?Group
            {
                return $this->legend($entries, $chartWidth, $y);
            }

            public function exposeLine(): string
            {
                return $this->line(1, 2, 3, 4, ['class' => 'a'])->toSvg();
            }

            public function exposePath(): string
            {
                return $this->path('M 0 0', ['class' => 'b'])->toSvg();
            }

            public function exposeRect(): string
            {
                return $this->rect(0, 0, 10, 5, ['class' => 'c'])->toSvg();
            }

            public function exposeText(): string
            {
                return $this->text('T', 1, 1, ['class' => 'd'])->toSvg();
            }

            public function exposeGroup(): string
            {
                return $this->group([Text::make('x', 1, 1)], ['class' => 'grp'])->toSvg();
            }
        };

        $chart = LineChart::make()
            ->labels(['January report', 'February report'])
            ->dataset('Sales growth over week', [10, 20])
            ->dataset('Profit margin long label', [12, 18]);

        $css = $renderer->exposeCss($chart, '.custom{display:none}');
        self::assertStringStartsWith(':root{', $css);
        self::assertStringContainsString('.chart-grid', $css);
        self::assertStringEndsWith('.custom{display:none}', $css);
        self::assertSame('bd2e14946fba3b248f5e1e9ba8f7774540d071244361c783d7fac6edfe2a1537', hash('sha256', $css));

        $area = new PlotArea(56, 24, 300, 120);
        $scale = LinearScale::fromValues([10, 20], $area);
        $grid = $renderer->exposeGrid($chart, $area, $scale);
        self::assertStringContainsString('chart-grid-group', $grid[0]->toSvg());

        self::assertSame('var(--chart-bg)', $renderer->exposeBackground());
        self::assertSame($chart->palette()[1], $renderer->exposeColor($chart, 1));
        self::assertNull($renderer->exposeLegend([new LegendEntry('Only', '#000')], 320));

        $legend = $renderer->exposeLegend([
            new LegendEntry('Sales growth over week', '#2563eb'),
            new LegendEntry('Profit margin projection', '#16a34a'),
            new LegendEntry('Marketing efficiency', '#9333ea'),
        ], 160);
        self::assertNotNull($legend);
        self::assertSame('36bc3b8cda52c3e6b8be409cbd0fe64d6e293eae3e07304ada0b80a4d6ea8291', hash('sha256', $legend?->toSvg() ?? ''));

        self::assertStringContainsString('<line', $renderer->exposeLine());
        self::assertStringContainsString('<path', $renderer->exposePath());
        self::assertStringContainsString('<rect', $renderer->exposeRect());
        self::assertStringContainsString('<text', $renderer->exposeText());
        self::assertStringContainsString('class="grp"', $renderer->exposeGroup());
    }
}
