import { FanCollectTemplate } from "./fan-collect/FanCollectTemplate";
import {
  calculateFanCollectMetadata,
  getFanCollectDurationInFrames,
} from "./fan-collect/calculateFanCollectMetadata";
import { fanCollectDefaultProps } from "./fan-collect/defaultProps";
import { fanCollectSchema } from "./fan-collect/schema";
import { PhotoWallCollectTemplate } from "./photo-wall-collect/PhotoWallCollectTemplate";
import {
  calculatePhotoWallCollectMetadata,
  getPhotoWallCollectDurationInFrames,
} from "./photo-wall-collect/calculatePhotoWallCollectMetadata";
import { photoWallCollectDefaultProps } from "./photo-wall-collect/defaultProps";
import { photoWallCollectSchema } from "./photo-wall-collect/schema";

export const videoTemplates = [
  {
    id: "FanCollect",
    component: FanCollectTemplate,
    durationInFrames: getFanCollectDurationInFrames(fanCollectDefaultProps),
    fps: fanCollectDefaultProps.fps,
    width: fanCollectDefaultProps.width,
    height: fanCollectDefaultProps.height,
    defaultProps: fanCollectDefaultProps,
    schema: fanCollectSchema,
    calculateMetadata: calculateFanCollectMetadata,
  },
  {
    id: "PhotoWallCollect",
    component: PhotoWallCollectTemplate,
    durationInFrames: getPhotoWallCollectDurationInFrames(
      photoWallCollectDefaultProps,
    ),
    fps: photoWallCollectDefaultProps.fps,
    width: photoWallCollectDefaultProps.width,
    height: photoWallCollectDefaultProps.height,
    defaultProps: photoWallCollectDefaultProps,
    schema: photoWallCollectSchema,
    calculateMetadata: calculatePhotoWallCollectMetadata,
  },
];
