import { type CalculateMetadataFunction, staticFile } from "remotion";
import { withPhotoWallCollectDefaults } from "./defaultProps";
import {
  measurePhotoWallCollectImages,
  resolvePhotoWallCollectImages,
} from "./staticImages";
import type { PhotoWallCollectTemplateProps } from "./types";

const isRemoteOrDataSource = (src: string) =>
  /^(https?:|data:|blob:)/i.test(src);

export const resolvePhotoWallCollectImageSrc = (src: string) => {
  return isRemoteOrDataSource(src) ? src : staticFile(src);
};

export const getPhotoWallCollectDurationInFrames = (
  props: PhotoWallCollectTemplateProps,
) => {
  const normalized = withPhotoWallCollectDefaults(props);
  const imageCount = normalized.images.length;
  const imageSeconds = normalized.displaySeconds + normalized.collectSeconds;

  return Math.max(
    1,
    Math.ceil(
      (imageCount * imageSeconds + normalized.finalHoldSeconds) *
        normalized.fps,
    ),
  );
};

export const calculatePhotoWallCollectMetadata: CalculateMetadataFunction<
  PhotoWallCollectTemplateProps
> = async ({ props }) => {
  const withDefaults = withPhotoWallCollectDefaults(props);
  const resolvedImages = resolvePhotoWallCollectImages(withDefaults);
  const measuredImages = await measurePhotoWallCollectImages(
    resolvedImages,
    resolvePhotoWallCollectImageSrc,
  );
  const normalized = withPhotoWallCollectDefaults({
    ...withDefaults,
    images: measuredImages,
  });

  return {
    width: normalized.width,
    height: normalized.height,
    fps: normalized.fps,
    durationInFrames: getPhotoWallCollectDurationInFrames(normalized),
    defaultOutName: `photo-wall-collect-${normalized.width}x${normalized.height}`,
    props: normalized,
  };
};
