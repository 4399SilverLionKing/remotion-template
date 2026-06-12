import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { withFanCollectDefaults } from "./defaultProps";
import { resolveFanCollectImageSrc } from "./calculateFanCollectMetadata";
import type {
  FanCollectImage,
  FanCollectOrientation,
  FanCollectTemplateProps,
} from "./types";

type CardMetrics = {
  displayWidth: number;
  displayHeight: number;
  finalWidth: number;
  finalHeight: number;
  orientationRotation: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const mix = (from: number, to: number, progress: number) => {
  return from + (to - from) * progress;
};

const degreesToRadians = (degrees: number) => {
  return (degrees * Math.PI) / 180;
};

const rotatePoint = (x: number, y: number, degrees: number) => {
  const radians = degreesToRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
};

const getAspectRatio = (image: FanCollectImage) => {
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

const getOrientationRotation = (
  aspectRatio: number,
  collectOrientation: FanCollectOrientation,
) => {
  if (collectOrientation === "auto") {
    return 0;
  }

  const isLandscape = aspectRatio >= 1;

  if (collectOrientation === "portrait") {
    return isLandscape ? 90 : 0;
  }

  return isLandscape ? 0 : 90;
};

const getCardMetrics = (
  image: FanCollectImage,
  props: FanCollectTemplateProps,
): CardMetrics => {
  const aspectRatio = getAspectRatio(image);
  const shortestSide = Math.min(props.width, props.height);
  const finalPortraitHeight = shortestSide * (props.fan.cardSizeRatio ?? 0.58);
  const finalPortraitWidth = finalPortraitHeight * (2 / 3);
  const orientationRotation = getOrientationRotation(
    aspectRatio,
    props.collectOrientation,
  );
  const displaySize = containSize(
    aspectRatio,
    props.width * 0.82,
    props.height * 0.78,
  );

  return {
    displayWidth: displaySize.width,
    displayHeight: displaySize.height,
    finalWidth:
      Math.abs(orientationRotation) === 90
        ? finalPortraitHeight
        : finalPortraitWidth,
    finalHeight:
      Math.abs(orientationRotation) === 90
        ? finalPortraitWidth
        : finalPortraitHeight,
    orientationRotation,
  };
};

const getFanAngle = (
  index: number,
  count: number,
  spreadDegrees: number,
  rotationOffset: number,
) => {
  if (count <= 1) {
    return rotationOffset;
  }

  return (
    rotationOffset -
    spreadDegrees / 2 +
    (spreadDegrees * index) / Math.max(count - 1, 1)
  );
};

export const FanCollectTemplate: React.FC<FanCollectTemplateProps> = (
  rawProps,
) => {
  const activeProps = withFanCollectDefaults(rawProps);
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
  const fanPivotX = activeProps.width * (activeProps.fan.pivotXRatio ?? 0.5);
  const fanPivotY = activeProps.height * (activeProps.fan.pivotYRatio ?? 0.82);
  const spreadDegrees = activeProps.fan.spreadDegrees ?? 58;
  const rotationOffset = activeProps.fan.rotationOffset ?? 0;

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

        const metrics = getCardMetrics(image, activeProps);
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
        const rawProgress =
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
        const progress = clamp(rawProgress, 0, 1);
        const fanAngle = getFanAngle(
          index,
          activeProps.images.length,
          spreadDegrees,
          rotationOffset,
        );
        const width = mix(metrics.displayWidth, metrics.finalWidth, progress);
        const height = mix(
          metrics.displayHeight,
          metrics.finalHeight,
          progress,
        );
        const finalRotation = fanAngle + metrics.orientationRotation;
        const rotation = finalRotation * progress;
        const displayCenter = {
          x: activeProps.width / 2,
          y: activeProps.height / 2,
        };
        const finalAnchorX =
          Math.abs(metrics.orientationRotation) === 90 ? width / 2 : 0;
        const finalAnchorY =
          Math.abs(metrics.orientationRotation) === 90 ? 0 : height / 2;
        const anchorOffset = rotatePoint(
          mix(0, finalAnchorX, progress),
          mix(height / 2, finalAnchorY, progress),
          rotation,
        );
        const finalCenter = {
          x: fanPivotX - anchorOffset.x,
          y: fanPivotY - anchorOffset.y,
        };
        const left = mix(displayCenter.x, finalCenter.x, progress);
        const top = mix(displayCenter.y, finalCenter.y, progress);
        const shadowAlpha = mix(0.22, 0.4, progress);
        const borderAlpha = mix(0, 1, progress);
        const introLift = mix(activeProps.height * 0.035, 0, introProgress);
        const introScale = mix(0.94, 1, introProgress);
        const introRotation = mix(-2.5, 0, introProgress);
        const isActive = localFrame < imageStageFrames;

        const cardStyle: CSSProperties = {
          position: "absolute",
          left,
          top,
          width,
          height,
          borderRadius: mix(
            activeProps.cardRadius * 1.4,
            activeProps.cardRadius,
            progress,
          ),
          background: activeProps.cardBackground,
          border: `2px solid ${
            progress > 0.02
              ? activeProps.cardBorderColor
              : `rgba(255, 255, 255, ${borderAlpha})`
          }`,
          boxShadow: `0 ${mix(24, 18, progress)}px ${mix(
            60,
            44,
            progress,
          )}px rgba(0, 0, 0, ${shadowAlpha})`,
          opacity: introProgress,
          overflow: "hidden",
          transform: `translate(-50%, -50%) translateY(${introLift}px) scale(${introScale}) rotate(${
            rotation + introRotation
          }deg)`,
          transformOrigin: "50% 50%",
          zIndex: isActive ? 1000 + index : index,
        };

        return (
          <div key={`${image.src}-${index}`} style={cardStyle}>
            <Img
              src={resolveFanCollectImageSrc(image.src)}
              alt={image.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: activeProps.imageFit,
                display: "block",
                translate: "0px -2px",
              }}
              from={-36}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
