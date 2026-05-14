<?php

declare(strict_types=1);

namespace Orchid\Charts\Contracts;

interface Theme
{
    /**
     * @return list<string>
     */
    public function colors(): array;

    public function backgroundColor(): string;

    public function gridColor(): string;

    public function textColor(): string;

    public function axisColor(): string;

    public function fontFamily(): string;
}
