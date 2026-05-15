<?php

declare(strict_types=1);

namespace Orchid\Charts;

use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\Renderers\Renderer;
use Orchid\Charts\Support\Color;
use Orchid\Charts\SVG\SvgDocument;
use Orchid\Charts\Theme\AdaptiveTheme;
use Orchid\Charts\Theme\Theme;
use Orchid\Charts\Theme\ThemeResolver;
use Orchid\Charts\Theme\Themes;
use Stringable;

abstract readonly class Chart implements Stringable, StyledChart
{
    /**
     * Create a new chart instance.
     *
     * @param  list<string>  $labels
     * @param  list<Dataset>  $datasets
     * @param  list<string>  $colors
     * @param  class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme  $theme
     * @param  array<string, mixed>  $options
     */
    final public function __construct(
        private array $labels = [],
        private array $datasets = [],
        private array $colors = [],
        private int $width = 800,
        private int $height = 300,
        private string|Theme|AdaptiveTheme $theme = Themes::class,
        private array $options = [],
        private ?Renderer $renderer = null,
    ) {}

    /**
     * Create a new chart instance.
     */
    public static function make(): static
    {
        return new static;
    }

    /**
     * Create the default renderer for this chart type.
     */
    abstract protected function defaultRenderer(): Renderer;

    /**
     * Set the chart labels.
     *
     * @param  list<string>  $labels
     */
    public function labels(array $labels): static
    {
        return $this->with(labels: $labels);
    }

    /**
     * Add a dataset to the chart.
     *
     * @param  list<int|float>  $values
     */
    public function dataset(string $label, array $values, string|callable|null $colorOrFormatter = null, ?callable $formatter = null): static
    {
        $color = null;
        $resolvedFormatter = $formatter;
        if (is_string($colorOrFormatter)) {
            $color = $colorOrFormatter;
        } elseif (is_callable($colorOrFormatter)) {
            $resolvedFormatter = $colorOrFormatter;
        }

        $datasets = $this->datasets;
        $datasets[] = new Dataset($label, $values, $color, $resolvedFormatter);

        return $this->with(datasets: $datasets);
    }

    /**
     * Set the chart color palette.
     *
     * @param  list<string>  $colors
     */
    public function colors(array $colors): static
    {
        foreach ($colors as $color) {
            if (! Color::isValid($color)) {
                throw new InvalidChartData(sprintf('Invalid color [%s].', $color));
            }
        }

        return $this->with(colors: $colors);
    }

    /**
     * Set the chart width.
     */
    public function width(int $width): static
    {
        return $this->with(width: max(1, $width));
    }

    /**
     * Set the chart height.
     */
    public function height(int $height): static
    {
        return $this->with(height: max(1, $height));
    }

    /**
     * Set the chart theme instance or theme class.
     *
     * @param  class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme  $theme
     */
    public function theme(string|Theme|AdaptiveTheme $theme): static
    {
        return $this->with(theme: $theme);
    }

    /**
     * Enable or disable smooth interpolation for line series.
     */
    public function smooth(bool $smooth = true): static
    {
        return $this->option('smooth', $smooth);
    }

    /**
     * Set a chart option value.
     */
    public function option(string $key, mixed $value): static
    {
        $options = $this->options;
        $options[$key] = $value;

        return $this->with(options: $options);
    }

    /**
     * Set a custom renderer instance for the chart.
     */
    public function renderer(Renderer $renderer): static
    {
        return $this->with(renderer: $renderer);
    }

    /**
     * Get the normalized chart data.
     */
    public function data(): ChartData
    {
        return new ChartData($this->labels, $this->datasets);
    }

    /**
     * Get the resolved chart width.
     */
    public function widthValue(): int
    {
        return $this->width;
    }

    /**
     * Get the resolved chart height.
     */
    public function heightValue(): int
    {
        return $this->height;
    }

    /**
     * Resolve the active light theme instance.
     */
    public function themeInstance(): Theme
    {
        return (new ThemeResolver)->resolveLight($this->theme);
    }

    /**
     * Resolve the active dark theme instance when available.
     */
    public function darkThemeInstance(): ?Theme
    {
        return (new ThemeResolver)->resolveDark($this->theme);
    }

    /**
     * Get the color palette used for rendering.
     */
    public function palette(): array
    {
        return $this->colors === [] ? $this->themeInstance()->colors() : $this->colors;
    }

    /**
     * Get all chart options.
     */
    public function options(): array
    {
        return $this->options;
    }

    /**
     * Determine whether line smoothing is enabled.
     */
    public function isSmoothEnabled(): bool
    {
        return (bool) ($this->options['smooth'] ?? true);
    }

    /**
     * Render the chart into an SVG document.
     */
    public function document(): SvgDocument
    {
        return $this->resolveRenderer()->render($this);
    }

    /**
     * Render the chart as an SVG string.
     */
    public function render(): string
    {
        return $this->document()->toSvg();
    }

    /**
     * Render the chart as an SVG string.
     */
    public function __toString(): string
    {
        return $this->render();
    }

    /**
     * Resolve the renderer used for rendering this chart.
     */
    private function resolveRenderer(): Renderer
    {
        return $this->renderer ?? $this->defaultRenderer();
    }

    /**
     * Clone the chart with updated state.
     *
     * @param  list<string>|null  $labels
     * @param  list<Dataset>|null  $datasets
     * @param  list<string>|null  $colors
     * @param  class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme|null  $theme
     * @param  array<string, mixed>|null  $options
     */
    private function with(
        ?array $labels = null,
        ?array $datasets = null,
        ?array $colors = null,
        ?int $width = null,
        ?int $height = null,
        string|Theme|AdaptiveTheme|null $theme = null,
        ?array $options = null,
        ?Renderer $renderer = null,
    ): static {
        return new static(
            $labels ?? $this->labels,
            $datasets ?? $this->datasets,
            $colors ?? $this->colors,
            $width ?? $this->width,
            $height ?? $this->height,
            $theme ?? $this->theme,
            $options ?? $this->options,
            $renderer ?? $this->renderer,
        );
    }
}
