import { Pipe, PipeTransform } from '@angular/core';
import { ILogger } from '../providers/diagnostics/logger';

@Pipe({
    name: 'sizedImage',
    standalone: false
})
export class ImageSizePipe implements PipeTransform {

  constructor(private _logger: ILogger) {
      this._logger.trace('ImageSizePipe - constructor ', ['ImageSizePipe']);
  }

  transform(value: string, imageSize: string): string {
    this._logger.trace('ImageSizePipe - transform ', ['ImageSizePipe']);

    if (value && value.indexOf('/' + imageSize + '/') === -1) {

      /* find the last index of / and insert size before it*/
      const originalImageUrl: string = value;
      const lastSlashIndex = originalImageUrl.lastIndexOf('/');

      // Check if we have a full url where it ends with /filename.ext
      if (lastSlashIndex > 0) {

        // Construct the sized image url. originals/{file} becomes {size}/{file}.
        const filename = originalImageUrl.slice(lastSlashIndex + 1, originalImageUrl.length);
        const prefixPath = originalImageUrl.slice(0, lastSlashIndex);
        const sizedImageUrl = this.withSizeFolder(prefixPath, imageSize.toLowerCase(), filename);

        this._logger.trace('ImageSizePipe - transform ', ['ImageSizePipe'], sizedImageUrl);

        return sizedImageUrl + '?firsttry';
      }
    }

    return value;
  }

  private static readonly sizeFolders = ['originals', '100x100', '480x360'];

  private withSizeFolder(prefixPath: string, imageSize: string, filename: string): string {
    const folderSlash = prefixPath.lastIndexOf('/');
    const parentFolder = folderSlash >= 0 ? prefixPath.slice(folderSlash + 1).toLowerCase() : '';

    if (ImageSizePipe.sizeFolders.indexOf(parentFolder) !== -1) {
      const root = prefixPath.slice(0, folderSlash);
      return root + '/' + imageSize + '/' + filename;
    }

    return prefixPath + '/' + imageSize + '/' + filename;
  }

}
