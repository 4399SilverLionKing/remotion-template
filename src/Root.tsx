import "./index.css";
import { Composition } from "remotion";
import { videoTemplates } from "./templates";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {videoTemplates.map((template) => (
        <Composition key={template.id} {...template} />
      ))}
    </>
  );
};
