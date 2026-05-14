<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG;

interface SvgElement
{
    public function toSvg(): string;
}
