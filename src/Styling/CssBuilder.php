<?php

declare(strict_types=1);

namespace Orchid\Charts\Styling;

final class CssBuilder
{
    /** @var list<string> */
    private array $rules = [];

    /**
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

    public function toCss(): string
    {
        return implode('', $this->rules);
    }

    public function raw(string $css): self
    {
        $this->rules[] = $css;

        return $this;
    }
}
