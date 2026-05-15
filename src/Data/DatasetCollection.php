<?php

declare(strict_types=1);

namespace Orchid\Charts\Data;

use Countable;
use IteratorAggregate;
use Traversable;

/**
 * @implements IteratorAggregate<int, Dataset>
 */
final readonly class DatasetCollection implements Countable, IteratorAggregate
{
    /**
     * Create a new dataset collection instance.
     *
     * @param  list<Dataset>  $items
     */
    public function __construct(private array $items) {}

    /**
     * Get the number of datasets in the collection.
     */
    public function count(): int
    {
        return count($this->items);
    }

    /**
     * Get an iterator for the datasets.
     *
     * @return Traversable<int, Dataset>
     */
    public function getIterator(): Traversable
    {
        yield from $this->items;
    }

    /**
     * Get a flattened list of numeric values from all datasets.
     *
     * @return list<int|float>
     */
    public function values(): array
    {
        $values = [];

        foreach ($this->items as $dataset) {
            foreach ($dataset->values as $value) {
                $values[] = $value;
            }
        }

        return $values;
    }
}
