<?php

declare(strict_types=1);

namespace Orchid\Charts\SVG;

use Stringable;

final readonly class SvgDocument implements Stringable
{
    /**
     * @param  list<SvgElement>  $children
     */
    public function __construct(
        public int $width,
        public int $height,
        private array $children,
        private string $css = '',
        private string $background = 'transparent',
    ) {}

    public function toSvg(): string
    {
        $content = [];

        if ($this->css !== '') {
            $content[] = '<style>'.htmlspecialchars($this->css, ENT_NOQUOTES | ENT_SUBSTITUTE, 'UTF-8').'</style>';
        }

        foreach ($this->children as $child) {
            $content[] = $child->toSvg();
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" role="img" fill="none" style="%s">%s</svg>',
            $this->width,
            $this->height,
            $this->width,
            $this->height,
            htmlspecialchars('background:'.$this->background, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
            implode('', $content),
        );
    }

    public function __toString(): string
    {
        return $this->toSvg();
    }
}
