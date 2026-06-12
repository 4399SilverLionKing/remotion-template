export type FanCollectOrientation = "portrait" | "landscape" | "auto";

export type FanCollectImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  orientation?: "portrait" | "landscape";
};

export type FanCollectFanOptions = {
  pivotXRatio?: number;
  pivotYRatio?: number;
  cardSizeRatio?: number;
  spreadDegrees?: number;
  rotationOffset?: number;
};

export type FanCollectTemplateProps = {
  images: FanCollectImage[];
  useDirectoryImages: boolean;
  imageDirectory: string;
  width: number;
  height: number;
  fps: number;
  displaySeconds: number;
  collectSeconds: number;
  finalHoldSeconds: number;
  background: string;
  imageFit: "contain" | "cover";
  collectOrientation: FanCollectOrientation;
  cardRadius: number;
  cardBorderColor: string;
  cardBackground: string;
  fan: FanCollectFanOptions;
};
