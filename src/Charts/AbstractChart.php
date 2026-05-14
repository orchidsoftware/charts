<?php

declare(strict_types=1);

namespace Orchid\Charts\Charts;

use Orchid\Charts\Contracts\AdaptiveTheme;
use Orchid\Charts\Contracts\Chart;
use Orchid\Charts\Contracts\Renderer;
use Orchid\Charts\Contracts\Theme;
use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Data\Dataset;
use Orchid\Charts\Enums\ChartType;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\Rendering\RendererFactory;
use Orchid\Charts\Support\Color;
use Orchid\Charts\SVG\SvgDocument;
use Orchid\Charts\Themes\Themes;
use Stringable;

abstract readonly class AbstractChart implements Chart, Stringable
{
    /**
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

    public static function make(): static
    {
        return new static;
    }

    abstract public function type(): ChartType;

    /**
     * @param  list<string>  $labels
     */
    public function labels(array $labels): static
    {
        return new static($labels, $this->datasets, $this->colors, $this->width, $this->height, $this->theme, $this->options, $this->renderer);
    }

    /**
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

        return new static($this->labels, $datasets, $this->colors, $this->width, $this->height, $this->theme, $this->options, $this->renderer);
    }

    /**
     * @param  list<string>  $colors
     */
    public function colors(array $colors): static
    {
        foreach ($colors as $color) {
            if (! Color::isValid($color)) {
                throw new InvalidChartData(sprintf('Invalid color [%s].', $color));
            }
        }

        return new static($this->labels, $this->datasets, $colors, $this->width, $this->height, $this->theme, $this->options, $this->renderer);
    }

    public function width(int $width): static
    {
        return new static($this->labels, $this->datasets, $this->colors, max(1, $width), $this->height, $this->theme, $this->options, $this->renderer);
    }

    public function height(int $height): static
    {
        return new static($this->labels, $this->datasets, $this->colors, $this->width, max(1, $height), $this->theme, $this->options, $this->renderer);
    }

    /**
     * @param  class-string<Theme|AdaptiveTheme>|Theme|AdaptiveTheme  $theme
     */
    public function theme(string|Theme|AdaptiveTheme $theme): static
    {
        return new static($this->labels, $this->datasets, $this->colors, $this->width, $this->height, $theme, $this->options, $this->renderer);
    }

    public function smooth(bool $smooth = true): static
    {
        return $this->option('smooth', $smooth);
    }

    public function option(string $key, mixed $value): static
    {
        $options = $this->options;
        $options[$key] = $value;

        return new static($this->labels, $this->datasets, $this->colors, $this->width, $this->height, $this->theme, $options, $this->renderer);
    }

    public function renderer(Renderer $renderer): static
    {
        return new static($this->labels, $this->datasets, $this->colors, $this->width, $this->height, $this->theme, $this->options, $renderer);
    }

    public function data(): ChartData
    {
        return new ChartData($this->labels, $this->datasets);
    }

    public function widthValue(): int
    {
        return $this->width;
    }

    public function heightValue(): int
    {
        return $this->height;
    }

    public function themeInstance(): Theme
    {
        if ($this->theme instanceof Theme) {
            return $this->theme;
        }

        if ($this->theme instanceof AdaptiveTheme) {
            return $this->theme->light();
        }

        $resolved = new $this->theme;
        if ($resolved instanceof Theme) {
            return $resolved;
        }

        return $resolved->light();
    }

    public function darkThemeInstance(): ?Theme
    {
        if ($this->theme instanceof AdaptiveTheme) {
            return $this->theme->dark();
        }

        if ($this->theme instanceof Theme) {
            return null;
        }

        $resolved = new $this->theme;
        if ($resolved instanceof AdaptiveTheme) {
            return $resolved->dark();
        }

        return null;
    }

    public function palette(): array
    {
        return $this->colors === [] ? $this->themeInstance()->colors() : $this->colors;
    }

    public function options(): array
    {
        return $this->options;
    }

    public function document(): SvgDocument
    {
        return ($this->renderer ?? (new RendererFactory)->make($this->type()))->render($this);
    }

    public function render(): string
    {
        return $this->document()->toSvg();
    }

    public function __toString(): string
    {
        return $this->render();
    }
}
