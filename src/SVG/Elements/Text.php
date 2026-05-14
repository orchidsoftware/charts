<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG\Elements;

final readonly class Text extends Element
{
    /**
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    public function __construct(private string $text, array $attributes = [])
    {
        parent::__construct($attributes);
    }

    /**
     * @param  array<string, bool|float|int|string|null>  $attributes
     */
    public static function make(string $text, float $x, float $y, array $attributes = []): self
    {
        return new self($text, ['x' => round($x, 2), 'y' => round($y, 2)] + $attributes);
    }

    public function toSvg(): string
    {
        return '<text'.$this->attributes().'>'.self::escape($this->text).'</text>';
    }
}
