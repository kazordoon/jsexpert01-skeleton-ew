export default class VideoMediaPlayer {
  constructor({ manifest, network, videoComponent }) {
    this.manifest = manifest;
    this.network = network;
    this.videoComponent = videoComponent;

    this.videoElement = null;
    this.sourceBuffer = null;
    this.activeItem = {};
    this.selected = {};
    this.videoDuration = 0;
    this.selections = [];
  }

  setVideoPlayerDuration(finalUrl) {
    const bars = finalUrl.split('/');
    const [, duration] = bars[bars.length - 1].split('-');

    this.videoDuration += parseFloat(duration);
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

  waitForQuestions() {
    const currentTime = parseInt(this.videoElement.currentTime, 10);
    const option = this.selected.at === currentTime;
    if (!option) return;

    // Evita que o modal seja aberto 2x no mesmo segundo
    if (this.activeItem.url === this.selected.url) return;

    this.videoComponent.configureModal(this.selected.options);
    this.activeItem = this.selected;
  }

  async fileDownload(url) {
    const fileResolution = await this.currentFileResolution();

    const prepareUrl = {
      url,
      fileResolution,
      fileResolutionTag: this.manifest.fileResolutionTag,
      hostTag: this.manifest.hostTag,
    };
    const finalUrl = this.network.parseManifestURL(prepareUrl);

    this.setVideoPlayerDuration(finalUrl);

    const data = await this.network.fetchFile(finalUrl);
    this.processBufferSegments(data);
  }

  manageLag(selected) {
    const alreadySelected = this.selections.includes(selected.url);
    if (alreadySelected) {
      selected.at += 5;
      return;
    }

    this.selections.push(selected.url);
  }

  async nextChunk(data) {
    const key = data.toLowerCase();
    const selected = this.manifest[key];

    this.selected = {
      ...selected,
      // Ajusta o tempo que o modal vai aparecer, baseado no tempo corrente
      at: parseInt(this.videoElement.currentTime + selected.at, 10),
    };
    this.manageLag(selected);

    // Permanece o vídeo rodando até o próximo ser baixado
    this.videoElement.play();
    await this.fileDownload(selected.url);
  }

  sourceOpenWrapper(mediaSource) {
    return async (_) => {
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifest.codec);
      this.selected = this.manifest.intro;

      // Evita rodar como "LIVE"
      mediaSource.duration = this.videoDuration;

      await this.fileDownload(this.selected.url);
      setInterval(this.waitForQuestions.bind(this), 200);
    };
  }

  async currentFileResolution() {
    const LOWEST_RESOLUTION = 144;
    const prepareUrl = {
      url: this.manifest.finalizar.url,
      fileResolution: LOWEST_RESOLUTION,
      fileResolutionTag: this.manifest.fileResolutionTag,
      hostTag: this.manifest.hostTag,
    };
    const url = this.network.parseManifestURL(prepareUrl);
    return this.network.getProperResolution(url);
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
}
