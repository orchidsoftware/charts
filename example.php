<?php

require 'vendor/autoload.php';

use Orchid\Charts\BarChart;
use Orchid\Charts\DonutChart;
use Orchid\Charts\LineChart;
use Orchid\Charts\PercentageChart;
use Orchid\Charts\PieChart;

$charts = [
    LineChart::class,
    BarChart::class,
    PieChart::class,
    DonutChart::class,
    PercentageChart::class,
];

$charts = array_map(function (string $chart) {
    $chart = $chart::make()
        ->labels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
        ->dataset('Sales', [1240, 1890, 1650, 2340, 2780, 3120])
        ->dataset('Profit', [890, 1340, 980, 1670, 2010, 2450]);

    if ($chart instanceof PercentageChart) {
        $chart = $chart->height(150);
    }

    return $chart;
}, $charts);

echo <<<'HTML'
<style>
    svg {
        width: 100%;
        height: auto;
    }

    .container {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 2em;
    }
</style>

<div class="container">
HTML;

foreach ($charts as $chart) {
    echo <<<HTML
    <div class="chart">
        {$chart}
    </div>

    HTML;
}

echo '</div>';
