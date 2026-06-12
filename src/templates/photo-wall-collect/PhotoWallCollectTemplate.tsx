import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { resolvePhotoWallCollectImageSrc } from "./calculatePhotoWallCollectMetadata";
import { withPhotoWallCollectDefaults } from "./defaultProps";
import type {
  PhotoWallCollectImage,
  PhotoWallCollectTemplateProps,
} from "./types";

type WallCardLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const mix = (from: number, to: number, progress: number) => {
  return from + (to - from) * progress;
};

const seededNoise = (index: number, salt: number) => {
  const value = Math.sin((index + 1) * 78.233 + salt * 37.719) * 43758.5453;

  return value - Math.floor(value);
};

const getAspectRatio = (image: PhotoWallCollectImage) => {
  if (image.aspectRatio && image.aspectRatio > 0) {
    return image.aspectRatio;
  }

  if (image.width && image.height) {
    return image.width / image.height;
  }

  return image.orientation === "landscape" ? 3 / 2 : 2 / 3;
};

const containSize = (
  aspectRatio: number,
  maxWidth: number,
  maxHeight: number,
) => {
  const widthFromHeight = maxHeight * aspectRatio;

  if (widthFromHeight <= maxWidth) {
    return {
      width: widthFromHeight,
      height: maxHeight,
    };
  }

  return {
    width: maxWidth,
    height: maxWidth / aspectRatio,
  };
};

const getRotatedBounds = (width: number, height: number, rotation: number) => {
  const radians = (Math.abs(rotation) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
};

const getGrid = (count: number, width: number, height: number) => {
  if (count <= 1) {
    return {
      columns: 1,
      rows: 1,
    };
  }

  const targetColumns = Math.sqrt(count * (width / height));
  const columns = Math.max(1, Math.ceil(targetColumns));

  return {
    columns,
    rows: Math.ceil(count / columns),
  };
};

const getWallLayouts = (
  images: PhotoWallCollectImage[],
  props: PhotoWallCollectTemplateProps,
): WallCardLayout[] => {
  const count = images.length;
  const margin =
    Math.min(props.width, props.height) * (props.wall.marginRatio ?? 0.055);
  const availableWidth = props.width - margin * 2;
  const availableHeight = props.height - margin * 2;
  const { columns, rows } = getGrid(count, availableWidth, availableHeight);
  const cellWidth = availableWidth / columns;
  const cellHeight = availableHeight / rows;
  const overlap = props.wall.overlapRatio ?? 0.18;
  const maxRotation = props.wall.maxRotationDegrees ?? 9;
  const slotStep = count % 5 === 0 ? 7 : 5;
  const slotOffset = Math.floor(count / 3);

  return images.map((image, index) => {
    const aspectRatio = getAspectRatio(image);
    const isLandscape = aspectRatio >= 1;
    const sizeVariation = 0.88 + seededNoise(index, 8) * 0.26;
    const areaScale =
      (0.98 + overlap * 1.45) * (isLandscape ? 1.22 : 1) * sizeVariation;
    const targetArea = (availableWidth * availableHeight * areaScale) / count;
    const rawWidth = Math.sqrt(targetArea * aspectRatio);
    const rawHeight = rawWidth / aspectRatio;
    const finalSize = containSize(
      aspectRatio,
      availableWidth * (isLandscape ? 0.62 : 0.48),
      availableHeight * (isLandscape ? 0.3 : 0.38),
    );
    const finalWidth = Math.min(rawWidth, finalSize.width);
    const finalHeight = Math.min(rawHeight, finalSize.height);
    const slotIndex = (index * slotStep + slotOffset) % count;
    const row = Math.floor(slotIndex / columns);
    const column = slotIndex % columns;
    const rowDrift = row % 2 === 0 ? 0.12 : -0.11;
    const columnDrift = column % 2 === 0 ? -0.1 : 0.12;
    const stackX = index % 5 === 1 ? -0.18 : index % 5 === 3 ? 0.2 : 0;
    const stackY = index % 4 === 0 ? 0.12 : index % 4 === 2 ? -0.14 : 0;
    const jitterX =
      (seededNoise(index, 2) - 0.5) * cellWidth * 0.42 +
      (rowDrift + stackX) * cellWidth;
    const jitterY =
      (seededNoise(index, 3) - 0.5) * cellHeight * 0.34 +
      (columnDrift + stackY) * cellHeight;
    const rotation =
      (seededNoise(index, 4) * 2 - 1) *
      maxRotation *
      (index % 3 === 1 ? 0.72 : 1);
    const rotatedBounds = getRotatedBounds(finalWidth, finalHeight, rotation);
    const x = margin + cellWidth * (column + 0.5) + jitterX;
    const y = margin + cellHeight * (row + 0.5) + jitterY;

    return {
      x: clamp(
        x,
        margin + rotatedBounds.width / 2,
        props.width - margin - rotatedBounds.width / 2,
      ),
      y: clamp(
        y,
        margin + rotatedBounds.height / 2,
        props.height - margin - rotatedBounds.height / 2,
      ),
      width: finalWidth,
      height: finalHeight,
      rotation,
    };
  });
};

export const PhotoWallCollectTemplate: React.FC<
  PhotoWallCollectTemplateProps
> = (rawProps) => {
  const activeProps = withPhotoWallCollectDefaults(rawProps);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFrames = Math.max(
    1,
    Math.round(activeProps.displaySeconds * fps),
  );
  const collectFrames = Math.max(
    1,
    Math.round(activeProps.collectSeconds * fps),
  );
  const introFrames = Math.max(
    1,
    Math.min(Math.round(0.36 * fps), Math.round(displayFrames * 0.42)),
  );
  const imageStageFrames = displayFrames + collectFrames;
  const wallLayouts = getWallLayouts(activeProps.images, activeProps);

  return (
    <AbsoluteFill
      style={{
        background: activeProps.background,
        overflow: "hidden",
      }}
    >
      {activeProps.images.map((image, index) => {
        const localFrame = frame - index * imageStageFrames;

        if (localFrame < 0) {
          return null;
        }

        const wallLayout = wallLayouts[index];
        const aspectRatio = getAspectRatio(image);
        const displaySize = containSize(
          aspectRatio,
          activeProps.width * 0.82,
          activeProps.height * 0.78,
        );
        const introProgress = interpolate(
          localFrame,
          [0, introFrames],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        );
        const collectProgress =
          localFrame < displayFrames
            ? 0
            : interpolate(
                localFrame,
                [displayFrames, displayFrames + collectFrames],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              );
        const progress = clamp(collectProgress, 0, 1);
        const width = mix(displaySize.width, wallLayout.width, progress);
        const height = mix(displaySize.height, wallLayout.height, progress);
        const x = mix(activeProps.width / 2, wallLayout.x, progress);
        const y = mix(activeProps.height / 2, wallLayout.y, progress);
        const rotation = mix(0, wallLayout.rotation, progress);
        const introLift = mix(activeProps.height * 0.035, 0, introProgress);
        const introScale = mix(0.94, 1, introProgress);
        const shadowAlpha = mix(0.26, 0.34, progress);
        const isActive = localFrame < imageStageFrames;

        const cardStyle: CSSProperties = {
          position: "absolute",
          left: x,
          top: y,
          width,
          height,
          borderRadius: mix(
            activeProps.cardRadius * 1.35,
            activeProps.cardRadius,
            progress,
          ),
          background: activeProps.cardBackground,
          border: `2px solid ${activeProps.cardBorderColor}`,
          boxShadow: `0 ${mix(24, 12, progress)}px ${mix(
            62,
            28,
            progress,
          )}px rgba(0, 0, 0, ${shadowAlpha})`,
          opacity: introProgress,
          overflow: "hidden",
          transform: `translate(-50%, -50%) translateY(${introLift}px) scale(${introScale}) rotate(${rotation}deg)`,
          transformOrigin: "50% 50%",
          zIndex: isActive ? 1000 + index : index,
        };

        return (
          <div key={`${image.src}-${index}`} style={cardStyle}>
            <Img
              src={resolvePhotoWallCollectImageSrc(image.src)}
              alt={image.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: activeProps.imageFit,
                display: "block",
              }}
              from={-36}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
