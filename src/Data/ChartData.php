<?php

declare(strict_types=1);

namespace Orchid\Charts\Data;

use Orchid\Charts\Exceptions\InvalidChartData;

final readonly class ChartData
{
    /** @var list<string> */
    public array $labels;

    /** @var list<Dataset> */
    public array $datasets;

    /**
     * Create a new chart data instance.
     *
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
     * Get a flattened list of numeric values from all datasets.
     *
     * @return list<int|float>
     */
    public function values(): array
    {
        return $this->datasets()->values();
    }

    /**
     * Get the first dataset in the chart.
     */
    public function firstDataset(): Dataset
    {
        $this->ensureDatasets();

        return $this->datasets[0];
    }

    /**
     * Get the label at the given index.
     */
    public function label(int $index): string
    {
        return $this->labels[$index] ?? (string) $index;
    }

    /**
     * Get datasets as a collection instance.
     */
    public function datasets(): DatasetCollection
    {
        return new DatasetCollection($this->datasets);
    }

    /**
     * Ensure that at least one dataset is present.
     */
    public function ensureDatasets(): void
    {
        if ($this->datasets === []) {
            throw new InvalidChartData('At least one dataset is required.');
        }
    }
}
