<?php

declare(strict_types=1);

namespace Orchid\Charts\Contracts;

interface AdaptiveTheme
{
    public function light(): Theme;

    public function dark(): Theme;
}
