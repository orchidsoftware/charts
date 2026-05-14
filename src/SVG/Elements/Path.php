<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG\Elements;

final readonly class Path extends Element
{
    /**
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    public static function make(string $d, array $attributes = []): self
    {
        return new self(['d' => $d] + $attributes);
    }

    public function toSvg(): string
    {
        return '<path'.$this->attributes().'/>';
    }
}
