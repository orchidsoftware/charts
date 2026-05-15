<?php

declare(strict_types=1);

namespace Orchid\Charts\Theme\Styles;

final class CssBuilder
{
    /** @var list<string> */
    private array $rules = [];

    /**
     * Append a CSS rule block.
     *
     * @param  array<string, string|int|float>  $declarations
     */
    public function rule(string $selector, array $declarations): self
    {
        $body = [];
        foreach ($declarations as $property => $value) {
            $body[] = $property.':'.$value;
        }

        $this->rules[] = $selector.'{'.implode(';', $body).'}';

        return $this;
    }

    /**
     * Compile all CSS rules into a stylesheet string.
     */
    public function toCss(): string
    {
        return implode('', $this->rules);
    }

    /**
     * Append a raw CSS fragment.
     */
    public function raw(string $css): self
    {
        $this->rules[] = $css;

        return $this;
    }
}
