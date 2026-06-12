import "./index.css";
import { Composition } from "remotion";
import { videoTemplates } from "./templates";

type CompositionProps = React.ComponentProps<typeof Composition>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {videoTemplates.map((template) => {
        const compositionProps = template as unknown as CompositionProps;

        return <Composition key={template.id} {...compositionProps} />;
      })}
    </>
  );
};
