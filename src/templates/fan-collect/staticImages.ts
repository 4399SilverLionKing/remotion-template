import { getStaticFiles } from "remotion";
import type { FanCollectImage, FanCollectTemplateProps } from "./types";

const imageExtensions = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const normalizeDirectory = (directory: string) => {
  return directory.replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");
};

const getExtension = (name: string) => {
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }

  return name.slice(dotIndex).toLowerCase();
};

const getAltText = (name: string) => {
  const parts = name.split("/");
  const fileName = parts[parts.length - 1] ?? name;
  const dotIndex = fileName.lastIndexOf(".");
  const withoutExtension =
    dotIndex === -1 ? fileName : fileName.slice(0, dotIndex);

  return withoutExtension.replace(/[-_]+/g, " ");
};

export const getFanCollectDirectoryImages = (
  directory: string,
): FanCollectImage[] => {
  const normalizedDirectory = normalizeDirectory(directory);
  const prefix = normalizedDirectory.length > 0 ? `${normalizedDirectory}/` : "";

  return getStaticFiles()
    .filter((file) => {
      if (!file.name.startsWith(prefix)) {
        return false;
      }

      return imageExtensions.has(getExtension(file.name));
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    )
    .map((file) => ({
      src: file.name,
      alt: getAltText(file.name),
    }));
};

const getBrowserImageDimensions = (src: string) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new Error("Image is not available in this environment."));
      return;
    }

    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = reject;
    image.src = src;
  });
};

export const measureFanCollectImages = async (
  images: FanCollectImage[],
  resolveSrc: (src: string) => string,
): Promise<FanCollectImage[]> => {
  return Promise.all(
    images.map(async (image) => {
      if (image.width && image.height) {
        return image;
      }

      try {
        const dimensions = await getBrowserImageDimensions(
          resolveSrc(image.src),
        );

        return {
          ...image,
          width: dimensions.width,
          height: dimensions.height,
        };
      } catch {
        return image;
      }
    }),
  );
};

export const resolveFanCollectImages = (
  props: FanCollectTemplateProps,
): FanCollectImage[] => {
  if (!props.useDirectoryImages) {
    return props.images;
  }

  return getFanCollectDirectoryImages(props.imageDirectory);
};
