<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG\Elements;

final readonly class Line extends Element
{
    /**
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    public static function make(float $x1, float $y1, float $x2, float $y2, array $attributes = []): self
    {
        return new self(['x1' => round($x1, 2), 'y1' => round($y1, 2), 'x2' => round($x2, 2), 'y2' => round($y2, 2)] + $attributes);
    }

    public function toSvg(): string
    {
        return '<line'.$this->attributes().'/>';
    }
}
