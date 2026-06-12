import { type CalculateMetadataFunction, staticFile } from "remotion";
import { withFanCollectDefaults } from "./defaultProps";
import {
  measureFanCollectImages,
  resolveFanCollectImages,
} from "./staticImages";
import type { FanCollectTemplateProps } from "./types";

const isRemoteOrDataSource = (src: string) =>
  /^(https?:|data:|blob:)/i.test(src);

export const resolveFanCollectImageSrc = (src: string) => {
  return isRemoteOrDataSource(src) ? src : staticFile(src);
};

export const getFanCollectDurationInFrames = (
  props: FanCollectTemplateProps,
) => {
  const normalized = withFanCollectDefaults(props);
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

export const calculateFanCollectMetadata: CalculateMetadataFunction<
  FanCollectTemplateProps
> = async ({ props }) => {
  const withDefaults = withFanCollectDefaults(props);
  const resolvedImages = resolveFanCollectImages(withDefaults);
  const measuredImages = await measureFanCollectImages(
    resolvedImages,
    resolveFanCollectImageSrc,
  );
  const normalized = withFanCollectDefaults({
    ...withDefaults,
    images: measuredImages,
  });

  return {
    width: normalized.width,
    height: normalized.height,
    fps: normalized.fps,
    durationInFrames: getFanCollectDurationInFrames(normalized),
    defaultOutName: `fan-collect-${normalized.width}x${normalized.height}`,
    props: normalized,
  };
};
