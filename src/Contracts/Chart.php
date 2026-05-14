<?php

declare(strict_types=1);

namespace Orchid\Charts\Contracts;

use Orchid\Charts\Data\ChartData;
use Orchid\Charts\Enums\ChartType;

interface Chart
{
    public function type(): ChartType;

    public function data(): ChartData;

    public function widthValue(): int;

    public function heightValue(): int;

    public function themeInstance(): Theme;

    public function darkThemeInstance(): ?Theme;

    /**
     * @return list<string>
     */
    public function palette(): array;

    /**
     * @return array<string, mixed>
     */
    public function options(): array;
}
