<?php

declare(strict_types=1);

namespace Orchid\Charts\Renderers\Tooltip;

use Orchid\Charts\Support\Precision;
use Orchid\Charts\SVG\Elements\Group;
use Orchid\Charts\SVG\Elements\Line;
use Orchid\Charts\SVG\Elements\Path;
use Orchid\Charts\SVG\Elements\Rect;
use Orchid\Charts\SVG\Elements\Text;

final readonly class TooltipPanelLayout
{
    /**
     * Create a new tooltip panel layout instance.
     */
    public function __construct(
        public float $x,
        public float $y,
        public float $width,
        public float $height,
        public float $pointerX,
    ) {}

    /**
     * Resolve a clamped tooltip panel layout from anchor and viewport bounds.
     */
    public static function fromAnchor(
        float $anchorX,
        float $preferredY,
        float $panelWidth,
        float $panelHeight,
        TooltipBounds $bounds,
        float $pointerInset = 10.0,
    ): self {
        $x = max($bounds->minX, min($bounds->maxX - $panelWidth, $anchorX - ($panelWidth / 2)));
        $y = max($bounds->minY, min($bounds->maxY - $panelHeight, $preferredY));
        $pointerX = max($x + $pointerInset, min($x + $panelWidth - $pointerInset, $anchorX));

        return new self($x, $y, $panelWidth, $panelHeight, $pointerX);
    }

    /**
     * Build the SVG path for the tooltip pointer triangle.
     */
    public function buildPointerPath(float $halfWidth = 5.0, float $pointerHeight = 7.0): string
    {
        return sprintf(
            'M %s %s L %s %s L %s %s Z',
            Precision::fixed($this->pointerX - $halfWidth),
            Precision::fixed($this->y + $this->height),
            Precision::fixed($this->pointerX),
            Precision::fixed($this->y + $this->height + $pointerHeight),
            Precision::fixed($this->pointerX + $halfWidth),
            Precision::fixed($this->y + $this->height),
        );
    }

    /**
     * Build the tooltip card for the resolved layout.
     */
    public function toTooltipGroup(TooltipContent $tooltip): Group
    {
        return new Group([
            Rect::make($this->x, $this->y, $this->width, $this->height, ['class' => 'chart-tooltip-panel', 'rx' => 6]),
            Path::make($this->buildPointerPath(), ['class' => 'chart-tooltip-pointer']),
            Text::make($tooltip->label, $this->x + 8, $this->y + 15, ['class' => 'chart-tooltip-title']),
            Line::make($this->x + 8, $this->y + 22, $this->x + $this->width - 8, $this->y + 22, ['class' => 'chart-tooltip-marker', 'stroke' => $tooltip->color]),
            Text::make($tooltip->formattedValue, $this->x + 8, $this->y + 36, ['class' => 'chart-tooltip-value']),
            Text::make($tooltip->absoluteValue, $this->x + 8, $this->y + 50, ['class' => 'chart-tooltip-meta']),
        ], ['class' => 'chart-tooltip']);
    }

    /**
     * @deprecated Use buildPointerPath().
     */
    public function pointerPath(float $halfWidth = 5.0, float $pointerHeight = 7.0): string
    {
        return $this->buildPointerPath($halfWidth, $pointerHeight);
    }

    /**
     * @deprecated Use toTooltipGroup().
     */
    public function toGroup(TooltipContent $tooltip): Group
    {
        return $this->toTooltipGroup($tooltip);
    }
}
