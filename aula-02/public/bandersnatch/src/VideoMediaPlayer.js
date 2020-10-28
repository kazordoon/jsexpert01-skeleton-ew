export default class VideoMediaPlayer {
  constructor({ manifest, network }) {
    this.manifest = manifest;
    this.network = network;

    this.videoElement = null;
    this.sourceBuffer = null;
    this.selected = {};
    this.videoDuration = 0;
  }

  sourceOpenWrapper(mediaSource) {
    return async (_) => {
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifest.codec);
      this.selected = this.manifest.intro;

      // Evita rodar como "LIVE"
      mediaSource.duration = this.videoDuration;

      await this.fileDownload(this.selected.url);
    };
  }

  initializeCodec() {
    this.videoElement = document.querySelector('#vid_html5_api');

    const mediaSourceNotSupported = !window.MediaSource;
    if (mediaSourceNotSupported) {
      return alert('Seu browser ou sistema não possui suporte a MSE!');
    }

    const codecNotSupported = !MediaSource.isTypeSupported(this.manifest.codec);
    if (codecNotSupported) {
      return alert(
        `Seu browser ou sistema não possui suporte ao codec: ${this.manifest.codec}`,
      );
    }

    const mediaSource = new MediaSource();
    this.videoElement.setAttribute('src', URL.createObjectURL(mediaSource));

    mediaSource.addEventListener(
      'sourceopen',
      this.sourceOpenWrapper(mediaSource),
    );
  }

  async fileDownload(url) {
    const prepareUrl = {
      url,
      fileResolution: 360,
      fileResolutionTag: this.manifest.fileResolutionTag,
      hostTag: this.manifest.hostTag,
    };
    const finalUrl = this.network.parseManifestURL(prepareUrl);

    this.setVideoPlayerDuration(finalUrl);

    const data = await this.network.fetchFile(finalUrl);
    this.processBufferSegments(data);
  }

  setVideoPlayerDuration(finalUrl) {
    const bars = finalUrl.split('/');
    const [name, duration] = bars[bars.length - 1].split('-');

    this.videoDuration += duration;
  }

  processBufferSegments(allSegments) {
    const sourceBuffer = this.sourceBuffer;

    sourceBuffer.appendBuffer(allSegments);

    return new Promise((resolve, reject) => {
      const updateEnd = (_) => {
        sourceBuffer.removeEventListener('updateend', updateEnd);
        sourceBuffer.timestampOffset = this.videoDuration;

        return resolve();
      };

      sourceBuffer.addEventListener('updateend', updateEnd);
      sourceBuffer.addEventListener('error', reject);
    });
  }
}
