<?php

declare(strict_types=1);

namespace Orchid\Charts\Support;

final class Precision
{
    private const int SCALE = 2;

    /**
     * Round a number using the shared SVG precision scale.
     */
    public static function round(int|float $value): float
    {
        return round((float) $value, self::SCALE);
    }

    /**
     * Format a rounded number without trailing zeros.
     */
    public static function plain(int|float $value): string
    {
        $formatted = number_format(self::round($value), self::SCALE, '.', '');

        return rtrim(rtrim($formatted, '0'), '.') ?: '0';
    }

    /**
     * Format a rounded number with a fixed number of decimals.
     */
    public static function fixed(int|float $value): string
    {
        return number_format(self::round($value), self::SCALE, '.', '');
    }
}
