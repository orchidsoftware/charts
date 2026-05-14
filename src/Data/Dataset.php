<?php

declare(strict_types=1);

namespace Orchid\Charts\Data;

use Closure;
use Orchid\Charts\Exceptions\InvalidChartData;
use Orchid\Charts\Support\Color;
use Stringable;

final readonly class Dataset
{
    public string $label;

    /** @var list<int|float> */
    public array $values;

    public ?string $color;

    private ?Closure $formatter;

    /**
     * @param  list<mixed>  $values
     */
    public function __construct(
        string $label,
        array $values,
        ?string $color = null,
        ?callable $formatter = null,
    ) {
        if ($label === '') {
            throw new InvalidChartData('Dataset label cannot be empty.');
        }

        if ($color !== null && ! Color::isValid($color)) {
            throw new InvalidChartData(sprintf('Invalid dataset color [%s].', $color));
        }

        $this->formatter = $formatter !== null ? Closure::fromCallable($formatter) : null;
        $this->label = $label;
        $this->values = $this->normalizeValues($values);
        $this->color = $color;
    }

    public function withColor(string $color): self
    {
        return new self($this->label, $this->values, $color, $this->formatter);
    }

    public function formatValue(int|float $value): string
    {
        if (! $this->formatter instanceof Closure) {
            return (string) $value;
        }

        $formatted = ($this->formatter)($value);
        if (! is_scalar($formatted) && ! $formatted instanceof Stringable) {
            throw new InvalidChartData('Dataset formatter must return scalar or Stringable value.');
        }

        return (string) $formatted;
    }

    /**
     * @param  list<mixed>  $values
     * @return list<int|float>
     */
    private function normalizeValues(array $values): array
    {
        if ($values === []) {
            throw new InvalidChartData('Dataset values cannot be empty.');
        }

        $validatedValues = [];

        foreach ($values as $value) {
            $validatedValues[] = $this->normalizeValue($value);
        }

        return $validatedValues;
    }

    private function normalizeValue(mixed $value): int|float
    {
        if (! is_int($value) && ! is_float($value)) {
            throw new InvalidChartData('Dataset values must be numeric.');
        }

        if (! is_finite((float) $value) || is_nan((float) $value)) {
            throw new InvalidChartData('Dataset values cannot contain NaN or INF.');
        }

        return $value;
    }
}
