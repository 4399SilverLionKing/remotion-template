import type { FanCollectTemplateProps } from "./types";

export const fanCollectDefaultProps: FanCollectTemplateProps = {
  images: [],
  useDirectoryImages: true,
  imageDirectory: "fan-collect",
  width: 1080,
  height: 1920,
  fps: 30,
  displaySeconds: 1.05,
  collectSeconds: 0.75,
  finalHoldSeconds: 1.1,
  background: "#211c18",
  imageFit: "contain",
  collectOrientation: "portrait",
  cardRadius: 26,
  cardBorderColor: "rgba(255, 255, 255, 0.82)",
  cardBackground: "#f4efe8",
  fan: {
    pivotXRatio: 0.5,
    pivotYRatio: 0.82,
    cardSizeRatio: 0.58,
    spreadDegrees: 58,
    rotationOffset: 0,
  },
};

export const withFanCollectDefaults = (
  props: FanCollectTemplateProps,
): FanCollectTemplateProps => ({
  ...fanCollectDefaultProps,
  ...props,
  fan: {
    ...fanCollectDefaultProps.fan,
    ...props.fan,
  },
});
