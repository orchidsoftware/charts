<?php

declare(strict_types=1);

namespace Orchid\Charts;

use Orchid\Charts\Data\ChartData;

interface ChartContract
{
    /**
     * Get the normalized chart data.
     */
    public function data(): ChartData;

    /**
     * Get the resolved chart width.
     */
    public function widthValue(): int;

    /**
     * Get the resolved chart height.
     */
    public function heightValue(): int;
}
