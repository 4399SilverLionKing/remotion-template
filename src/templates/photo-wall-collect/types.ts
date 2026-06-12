export type PhotoWallCollectImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  orientation?: "portrait" | "landscape";
};

export type PhotoWallCollectWallOptions = {
  marginRatio?: number;
  gapRatio?: number;
  overlapRatio?: number;
  maxRotationDegrees?: number;
};

export type PhotoWallCollectTemplateProps = {
  images: PhotoWallCollectImage[];
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
  cardRadius: number;
  cardBorderColor: string;
  cardBackground: string;
  wall: PhotoWallCollectWallOptions;
};
