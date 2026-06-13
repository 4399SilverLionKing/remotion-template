import type { PhotoWallCollectTemplateProps } from "./types";

export const photoWallCollectDefaultProps: PhotoWallCollectTemplateProps = {
  images: [],
  useDirectoryImages: true,
  imageDirectory: "fan-collect",
  width: 1080,
  height: 1920,
  fps: 30,
  randomSeed: 1,
  displaySeconds: 1.05,
  collectSeconds: 0.75,
  finalHoldSeconds: 1.25,
  deckCollectSeconds: 0.95,
  shuffleSeconds: 1.35,
  revealSeconds: 0.68,
  revealHoldSeconds: 0.95,
  returnSeconds: 0.9,
  deckEndHoldSeconds: 0.8,
  background: "#211c18",
  imageFit: "cover",
  cardRadius: 22,
  cardBorderColor: "rgba(255, 255, 255, 0.78)",
  cardBackground: "#f4efe8",
  cardBackSrc: "common/card.png",
  cardBackBackground: "#efe2cf",
  wall: {
    marginRatio: 0.055,
    gapRatio: 0.02,
    overlapRatio: 0.38,
    maxRotationDegrees: 12,
  },
};

export const withPhotoWallCollectDefaults = (
  props: PhotoWallCollectTemplateProps,
): PhotoWallCollectTemplateProps => ({
  ...photoWallCollectDefaultProps,
  ...props,
  wall: {
    ...photoWallCollectDefaultProps.wall,
    ...props.wall,
  },
});
