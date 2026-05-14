<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG\Elements;

use Orchid\Charts\SVG\SvgElement;

abstract readonly class Element implements SvgElement
{
    /**
     * @param  array<string, scalar|null>  $attributes
     */
    public function __construct(protected array $attributes = []) {}

    protected function attributes(): string
    {
        $parts = [];

        foreach ($this->attributes as $name => $value) {
            if ($value === null) {
                continue;
            }

            $parts[] = sprintf('%s="%s"', $name, self::escape((string) $value));
        }

        return $parts === [] ? '' : ' '.implode(' ', $parts);
    }

    protected static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
