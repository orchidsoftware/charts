<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG\Elements;

use Orchid\Charts\SVG\SvgElement;

final readonly class Group extends Element
{
    /**
     * @param  list<SvgElement>  $children
     */
    public function __construct(private array $children = [], array $attributes = [])
    {
        parent::__construct($attributes);
    }

    public function toSvg(): string
    {
        $svg = [];
        foreach ($this->children as $child) {
            $svg[] = $child->toSvg();
        }

        return '<g'.$this->attributes().'>'.implode('', $svg).'</g>';
    }
}
