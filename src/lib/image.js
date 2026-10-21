// Maps a media asset row to the image shape used by pages and components.

/**
 * @param {{ url: string, width: number, height: number, alt: string } | null | undefined} asset
 * @returns {{ src: string, width: number, height: number, alt: string } | null | undefined}
 */
export const toImage = (asset) =>
  asset && { src: asset.url, width: asset.width, height: asset.height, alt: asset.alt };
