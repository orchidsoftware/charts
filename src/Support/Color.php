<?php

declare(strict_types=1);

namespace Orchid\Charts\Support;

final readonly class Color
{
    public static function isValid(string $color): bool
    {
        return preg_match('/^#(?:[0-9a-fA-F]{3}){1,2}$/', $color) === 1
            || preg_match('/^rgb\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*\)$/', $color) === 1
            || preg_match('/^rgba\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:0|1|0?\.\d+)\s*\)$/', $color) === 1;
    }
}
