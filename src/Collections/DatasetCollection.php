<?php

declare(strict_types=1);

namespace Orchid\Charts\Collections;

use Countable;
use IteratorAggregate;
use Orchid\Charts\Data\Dataset;
use Traversable;

/**
 * @implements IteratorAggregate<int, Dataset>
 */
final readonly class DatasetCollection implements Countable, IteratorAggregate
{
    /**
     * @param  list<Dataset>  $items
     */
    public function __construct(private array $items) {}

    public function count(): int
    {
        return count($this->items);
    }

    /**
     * @return Traversable<int, Dataset>
     */
    public function getIterator(): Traversable
    {
        yield from $this->items;
    }

    /**
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
