<?php

require 'vendor/autoload.php';

use Orchid\Charts\Charts\BarChart;
use Orchid\Charts\Charts\DonutChart;
use Orchid\Charts\Charts\HeatmapChart;
use Orchid\Charts\Charts\LineChart;
use Orchid\Charts\Charts\PercentageChart;
use Orchid\Charts\Charts\PieChart;
use Orchid\Charts\Charts\ScatterChart;
use Orchid\Charts\Themes\LightTheme;

$classes = [
    LineChart::class,
    BarChart::class,
    PieChart::class,
    DonutChart::class,
    PercentageChart::class,
];

echo "<style>svg{width:100%; height:auto;}</style>";

echo "<div class='container' style='max-widht:800px;'>";
foreach ($classes as $class) {

    echo "<div class='chart'>";
    $chart = $class::make()
        ->labels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
        ->dataset('Sales', [1240, 1890, 1650, 2340, 2780, 3120])
        ->dataset('Profit', [890, 1340, 980, 1670, 2010, 2450]);

    echo $chart;


    echo "</div>";

}

echo "</div>";