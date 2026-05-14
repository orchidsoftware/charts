<?php

declare(strict_types=1);

namespace Orchid\Charts\Tests\Concerns;

use PHPUnit\Framework\Assert;

trait MatchesSvgSnapshots
{
    protected function assertMatchesSvgSnapshot(string $svg, string $snapshot): void
    {
        Assert::assertSame($this->normalizeSvg($snapshot), $this->normalizeSvg($svg));
    }

    private function normalizeSvg(string $svg): string
    {
        return trim(preg_replace('/\s+/', ' ', $svg) ?? $svg);
    }
}
