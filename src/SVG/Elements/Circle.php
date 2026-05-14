<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG\Elements;

final readonly class Circle extends Element
{
    /**
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    public static function make(float $cx, float $cy, float $r, array $attributes = []): self
    {
        return new self(['cx' => round($cx, 2), 'cy' => round($cy, 2), 'r' => round($r, 2)] + $attributes);
    }

    public function toSvg(): string
    {
        return '<circle'.$this->attributes().'/>';
    }
}
