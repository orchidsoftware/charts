<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG\Elements;

final readonly class Rect extends Element
{
    /**
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    public static function make(float $x, float $y, float $width, float $height, array $attributes = []): self
    {
        return new self(['x' => round($x, 2), 'y' => round($y, 2), 'width' => round($width, 2), 'height' => round($height, 2)] + $attributes);
    }

    public function toSvg(): string
    {
        return '<rect'.$this->attributes().'/>';
    }
}
