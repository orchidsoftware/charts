<?php

declare(strict_types=1);

namespace Orchid\Charts\Data;

use Orchid\Charts\Collections\DatasetCollection;
use Orchid\Charts\Exceptions\InvalidChartData;

final readonly class ChartData
{
    /** @var list<string> */
    public array $labels;

    /** @var list<Dataset> */
    public array $datasets;

    /**
     * @param  list<mixed>  $labels
     * @param  list<mixed>  $datasets
     */
    public function __construct(
        array $labels = [],
        array $datasets = [],
    ) {
        $validatedLabels = [];

        foreach ($labels as $label) {
            if (! is_string($label)) {
                throw new InvalidChartData('Chart labels must be strings.');
            }

            $validatedLabels[] = $label;
        }

        $validatedDatasets = [];

        foreach ($datasets as $dataset) {
            if (! $dataset instanceof Dataset) {
                throw new InvalidChartData('Chart datasets must contain Dataset instances.');
            }

            if ($validatedLabels !== [] && count($dataset->values) !== count($validatedLabels)) {
                throw new InvalidChartData('Each dataset must contain the same number of values as labels.');
            }

            $validatedDatasets[] = $dataset;
        }

        $this->labels = $validatedLabels;
        $this->datasets = $validatedDatasets;
    }

    /**
     * @return list<int|float>
     */
    public function values(): array
    {
        return $this->collection()->values();
    }

    public function collection(): DatasetCollection
    {
        return new DatasetCollection($this->datasets);
    }

    public function requireDatasets(): void
    {
        if ($this->datasets === []) {
            throw new InvalidChartData('At least one dataset is required.');
        }
    }
}
