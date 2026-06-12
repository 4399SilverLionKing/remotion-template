import { FanCollectTemplate } from "./fan-collect/FanCollectTemplate";
import {
  calculateFanCollectMetadata,
  getFanCollectDurationInFrames,
} from "./fan-collect/calculateFanCollectMetadata";
import { fanCollectDefaultProps } from "./fan-collect/defaultProps";
import { fanCollectSchema } from "./fan-collect/schema";

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
];
