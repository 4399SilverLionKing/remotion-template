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

type DeckCardLayout = WallCardLayout;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const mix = (from: number, to: number, progress: number) => {
  return from + (to - from) * progress;
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const progressBetween = (
  value: number,
  from: number,
  to: number,
  easing = easeOut,
) => {
  if (to <= from) {
    return value >= to ? 1 : 0;
  }

  return interpolate(value, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
};

const seededNoise = (index: number, salt: number, seed: number) => {
  const value =
    Math.sin((index + 1) * 78.233 + salt * 37.719 + seed * 19.193) * 43758.5453;

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
    const sizeVariation = 0.88 + seededNoise(index, 8, props.randomSeed) * 0.26;
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
      (seededNoise(index, 2, props.randomSeed) - 0.5) * cellWidth * 0.42 +
      (rowDrift + stackX) * cellWidth;
    const jitterY =
      (seededNoise(index, 3, props.randomSeed) - 0.5) * cellHeight * 0.34 +
      (columnDrift + stackY) * cellHeight;
    const rotation =
      (seededNoise(index, 4, props.randomSeed) * 2 - 1) *
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

const getDeckSize = (props: PhotoWallCollectTemplateProps) => {
  return containSize(2 / 3, props.width * 0.48, props.height * 0.4);
};

const getFeatureSize = (props: PhotoWallCollectTemplateProps) => {
  return containSize(2 / 3, props.width * 0.86, props.height * 0.74);
};

const getShuffledIndices = (count: number, seed: number) => {
  return Array.from({ length: count }, (_, index) => index).sort((a, b) => {
    const difference = seededNoise(a, 31, seed) - seededNoise(b, 31, seed);

    return difference === 0 ? a - b : difference;
  });
};

const getStackPosition = (
  reviewIndex: number,
  completedCount: number,
  count: number,
) => {
  if (count <= 0) {
    return 0;
  }

  if (reviewIndex < completedCount) {
    return count - completedCount + reviewIndex;
  }

  return reviewIndex - completedCount;
};

const getDeckLayout = (
  props: PhotoWallCollectTemplateProps,
  stackPosition: number,
): DeckCardLayout => {
  const deckSize = getDeckSize(props);
  const visibleDepth = Math.min(stackPosition, 12);

  return {
    x: props.width / 2 + ((stackPosition % 3) - 1) * 1.4,
    y: props.height / 2 + visibleDepth * 1.1,
    width: deckSize.width,
    height: deckSize.height,
    rotation: ((stackPosition % 5) - 2) * 0.28,
  };
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
  const wallCompleteFrame = activeProps.images.length * imageStageFrames;
  const wallHoldFrames = Math.max(
    0,
    Math.round(activeProps.finalHoldSeconds * fps),
  );
  const deckCollectFrames = Math.max(
    1,
    Math.round(activeProps.deckCollectSeconds * fps),
  );
  const shuffleFrames = Math.max(
    1,
    Math.round(activeProps.shuffleSeconds * fps),
  );
  const revealFrames = Math.max(1, Math.round(activeProps.revealSeconds * fps));
  const revealHoldFrames = Math.max(
    1,
    Math.round(activeProps.revealHoldSeconds * fps),
  );
  const returnFrames = Math.max(1, Math.round(activeProps.returnSeconds * fps));
  const reviewStageFrames = revealFrames + revealHoldFrames + returnFrames;
  const deckCollectStart = wallCompleteFrame + wallHoldFrames;
  const shuffleStart = deckCollectStart + deckCollectFrames;
  const reviewStart = shuffleStart + shuffleFrames;
  const reviewEnd = reviewStart + activeProps.images.length * reviewStageFrames;
  const wallLayouts = getWallLayouts(activeProps.images, activeProps);
  const reviewOrder = getShuffledIndices(
    activeProps.images.length,
    activeProps.randomSeed,
  );
  const reviewPositions = reviewOrder.reduce<number[]>(
    (positions, imageIndex, orderIndex) => {
      positions[imageIndex] = orderIndex;

      return positions;
    },
    [],
  );

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
        const introProgress = progressBetween(localFrame, 0, introFrames);
        const collectProgress =
          localFrame < displayFrames
            ? 0
            : progressBetween(
                localFrame,
                displayFrames,
                displayFrames + collectFrames,
              );
        let progress = clamp(collectProgress, 0, 1);
        let width = mix(displaySize.width, wallLayout.width, progress);
        let height = mix(displaySize.height, wallLayout.height, progress);
        let x = mix(activeProps.width / 2, wallLayout.x, progress);
        let y = mix(activeProps.height / 2, wallLayout.y, progress);
        let rotation = mix(0, wallLayout.rotation, progress);
        let flipY = 0;
        let zIndex = localFrame < imageStageFrames ? 1000 + index : index;
        const introLift = mix(activeProps.height * 0.035, 0, introProgress);
        const introScale = mix(0.94, 1, introProgress);
        let shadowAlpha = mix(0.26, 0.34, progress);
        let isShowcaseActive = false;
        let rotateImageForShowcase = false;
        let borderRadius = mix(
          activeProps.cardRadius * 1.35,
          activeProps.cardRadius,
          progress,
        );

        if (frame >= deckCollectStart) {
          const reviewIndex = reviewPositions[index] ?? index;
          const reviewLocal = frame - reviewStart;
          const rawActiveStep = Math.floor(reviewLocal / reviewStageFrames);
          const completedCount = clamp(
            reviewLocal < 0 ? 0 : rawActiveStep,
            0,
            activeProps.images.length,
          );
          const displayCompletedCount =
            frame >= reviewEnd ? activeProps.images.length : completedCount;
          const isReviewActive =
            reviewLocal >= 0 &&
            rawActiveStep >= 0 &&
            rawActiveStep < activeProps.images.length &&
            reviewIndex === rawActiveStep;
          const stackPosition = getStackPosition(
            reviewIndex,
            displayCompletedCount,
            activeProps.images.length,
          );
          const deckLayout = getDeckLayout(activeProps, stackPosition);
          const deckCollectProgress = progressBetween(
            frame,
            deckCollectStart,
            deckCollectStart + deckCollectFrames,
            easeInOut,
          );

          progress = deckCollectProgress;
          width = mix(wallLayout.width, deckLayout.width, deckCollectProgress);
          height = mix(
            wallLayout.height,
            deckLayout.height,
            deckCollectProgress,
          );
          x = mix(wallLayout.x, deckLayout.x, deckCollectProgress);
          y = mix(wallLayout.y, deckLayout.y, deckCollectProgress);
          rotation = mix(
            wallLayout.rotation,
            deckLayout.rotation,
            deckCollectProgress,
          );
          shadowAlpha = mix(0.34, 0.42, deckCollectProgress);
          borderRadius = mix(
            activeProps.cardRadius,
            activeProps.cardRadius * 0.82,
            deckCollectProgress,
          );
          zIndex = 3000 + index;

          if (frame >= shuffleStart) {
            const shuffleLocal = frame - shuffleStart;
            const shuffleProgress = progressBetween(
              frame,
              shuffleStart,
              shuffleStart + shuffleFrames,
              easeInOut,
            );
            const flipProgress = progressBetween(
              shuffleLocal,
              0,
              shuffleFrames * 0.42,
              easeInOut,
            );
            const shuffleSpread =
              Math.sin(shuffleProgress * Math.PI) * activeProps.width * 0.14;
            const shuffleAngle =
              shuffleProgress * Math.PI * 5 +
              seededNoise(index, 17, activeProps.randomSeed) * Math.PI * 2;

            x = deckLayout.x + Math.sin(shuffleAngle) * shuffleSpread;
            y =
              deckLayout.y +
              Math.cos(shuffleAngle * 0.9) * shuffleSpread * 0.24;
            rotation =
              deckLayout.rotation +
              Math.sin(shuffleAngle * 1.2) *
                7 *
                Math.sin(shuffleProgress * Math.PI);
            flipY = mix(0, 180, flipProgress);
            zIndex = 4000 + index;
          }

          if (frame >= reviewStart) {
            const deckFaceDownLayout = getDeckLayout(
              activeProps,
              stackPosition,
            );

            width = deckFaceDownLayout.width;
            height = deckFaceDownLayout.height;
            x = deckFaceDownLayout.x;
            y = deckFaceDownLayout.y;
            rotation = deckFaceDownLayout.rotation;
            flipY = 180;
            shadowAlpha = 0.42;
            zIndex = 5000 + activeProps.images.length - stackPosition;

            if (isReviewActive) {
              isShowcaseActive = true;
              const stepFrame = reviewLocal - rawActiveStep * reviewStageFrames;
              const featureSize = getFeatureSize(activeProps);
              const featureX = activeProps.width / 2;
              const featureY = activeProps.height / 2;
              const returnTargetLayout = getDeckLayout(
                activeProps,
                activeProps.images.length - 1,
              );
              const flipEndFrame = Math.max(1, Math.round(revealFrames * 0.42));
              const liftStartFrame = flipEndFrame;
              const slideOutEndFrame = Math.max(
                1,
                Math.round(returnFrames * 0.44),
              );
              const slideInStartFrame = Math.max(
                slideOutEndFrame + 1,
                Math.round(returnFrames * 0.56),
              );
              const revealFlipProgress = progressBetween(
                stepFrame,
                0,
                flipEndFrame,
                easeInOut,
              );
              const liftProgress = progressBetween(
                stepFrame,
                liftStartFrame,
                revealFrames,
                easeOut,
              );
              const returnProgress = progressBetween(
                stepFrame,
                revealFrames + revealHoldFrames,
                reviewStageFrames,
                easeInOut,
              );
              const returnLocal = stepFrame - revealFrames - revealHoldFrames;
              const slideOutProgress = progressBetween(
                returnLocal,
                0,
                slideOutEndFrame,
                Easing.in(Easing.cubic),
              );
              const slideInProgress = progressBetween(
                returnLocal,
                slideInStartFrame,
                returnFrames,
                easeOut,
              );
              const slideOutY = -featureSize.height * 0.72;
              const slideInY = activeProps.height + returnTargetLayout.height;
              const offscreenRotation = -3.5;
              rotateImageForShowcase =
                getAspectRatio(image) >= 1 && returnLocal < slideOutEndFrame;

              if (stepFrame < revealFrames + revealHoldFrames) {
                const liftArc =
                  -Math.sin(liftProgress * Math.PI) * activeProps.height * 0.04;

                width = mix(
                  deckFaceDownLayout.width,
                  featureSize.width,
                  liftProgress,
                );
                height = mix(
                  deckFaceDownLayout.height,
                  featureSize.height,
                  liftProgress,
                );
                x = mix(deckFaceDownLayout.x, featureX, liftProgress);
                y = mix(deckFaceDownLayout.y, featureY, liftProgress) + liftArc;
                rotation = mix(deckFaceDownLayout.rotation, 0, liftProgress);
                flipY = mix(180, 360, revealFlipProgress);
              } else if (returnLocal < slideOutEndFrame) {
                width = featureSize.width;
                height = featureSize.height;
                x = featureX;
                y = mix(featureY, slideOutY, slideOutProgress);
                rotation = mix(0, offscreenRotation, slideOutProgress);
                flipY = 360;
              } else {
                width = returnTargetLayout.width;
                height = returnTargetLayout.height;
                x = returnTargetLayout.x;
                y = mix(slideInY, returnTargetLayout.y, slideInProgress);
                rotation = mix(
                  2.5,
                  returnTargetLayout.rotation,
                  slideInProgress,
                );
                flipY = 540;
              }
              shadowAlpha = mix(0.48, 0.4, returnProgress);
              zIndex = 9000 + rawActiveStep;
            }
          }
        }

        const cardShellStyle: CSSProperties = {
          position: "absolute",
          left: x,
          top: y,
          width,
          height,
          opacity: introProgress,
          transform: `translate(-50%, -50%) translateY(${introLift}px) scale(${introScale}) rotate(${rotation}deg)`,
          transformOrigin: "50% 50%",
          perspective: 1400,
          zIndex,
        };

        const cardFlipStyle: CSSProperties = {
          position: "absolute",
          inset: 0,
          borderRadius,
          boxShadow: `0 ${mix(24, 12, progress)}px ${mix(
            62,
            28,
            progress,
          )}px rgba(0, 0, 0, ${shadowAlpha})`,
          transform: `rotateY(${flipY}deg)`,
          transformStyle: "preserve-3d",
        };

        const faceStyle: CSSProperties = {
          position: "absolute",
          inset: 0,
          borderRadius,
          border: `2px solid ${activeProps.cardBorderColor}`,
          backfaceVisibility: "hidden",
          background: activeProps.cardBackground,
          overflow: "hidden",
        };

        const backStyle: CSSProperties = {
          ...faceStyle,
          background: activeProps.cardBackBackground,
          transform: "rotateY(180deg)",
        };
        const imageFrameStyle: CSSProperties = rotateImageForShowcase
          ? {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: height,
              height: width,
              transform: "translate(-50%, -50%) rotate(90deg)",
              transformOrigin: "50% 50%",
            }
          : {
              position: "absolute",
              inset: 0,
            };
        const imageStyle: CSSProperties = {
          width: "100%",
          height: "100%",
          objectFit: isShowcaseActive ? "cover" : activeProps.imageFit,
          display: "block",
        };
        const cardBackImageStyle: CSSProperties = {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        };

        return (
          <div key={`${image.src}-${index}`} style={cardShellStyle}>
            <div style={cardFlipStyle}>
              <div style={faceStyle}>
                <div style={imageFrameStyle}>
                  <Img
                    src={resolvePhotoWallCollectImageSrc(image.src)}
                    alt={image.alt}
                    style={imageStyle}
                    from={-36}
                  />
                </div>
              </div>
              <div style={backStyle}>
                <Img
                  src={resolvePhotoWallCollectImageSrc(activeProps.cardBackSrc)}
                  alt=""
                  style={cardBackImageStyle}
                  from={-36}
                />
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
