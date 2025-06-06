/** @file Keeps track of images that have been loaded by the browser. */

import { readable, type Readable } from "svelte/store";

class MultisizeImage {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Reactive store for the blob URL with closest width to the requested one,
   * falling back on other sizes if necessary.
   */
  closestWidth(width: number): Readable<string | null> {
    // The `width` parameter is no longer used, but kept for API compatibility for now.
    // TODO: Consider removing `width` parameter in a future refactor if ArtImage.svelte is also updated.
    return readable(this.url);
  }
}

class ImageStore {
  /** Map of image URLs to a set of loaded "detail" strings. */
  map: Map<string, MultisizeImage>;

  constructor() {
    this.map = new Map();
  }

  /**
   * Request an image of a particular width, returning a store based on when it
   * loads and any previously-loaded sizes of this image.
   */
  requestSize(url: string, width: number): Readable<string | null> {
    let img = this.map.get(url);
    if (!img) {
      img = new MultisizeImage(url);
      this.map.set(url, img);
    }
    // img.load(width);
    return img.closestWidth(width);
  }
}

export default ImageStore;
