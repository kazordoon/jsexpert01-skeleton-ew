export default class Network {
  constructor(host) {
    this.host = host;
  }

  parseManifestURL({ url, fileResolution, fileResolutionTag, hostTag }) {
    return url
      .replace(fileResolutionTag, fileResolution)
      .replace(hostTag, this.host);
  }

  async fetchFile(url) {
    const buffer = await (await fetch(url)).arrayBuffer();
    return buffer;
  }

  async getProperResolution(url) {
    const startMs = Date.now();
    const response = await fetch(url);
    await response.arrayBuffer();
    const endMs = Date.now();
    const durationInMs = endMs - startMs;

    // Cálculo de resolução pelo tempo
    const resolutions = [
      { start: 3001, end: 20000, resolution: 144 }, // Até 20 segundos
      { start: 901, end: 3000, resolution: 360 }, // Até 3 segundos
      { start: 0, end: 900, resolution: 720 }, // Menos de 1 segundo
    ];

    const resolution = resolutions.find(
      (resolution) =>
        resolution.start <= durationInMs && resolution.end >= durationInMs,
    );

    const LOWEST_RESOLUTION = 144;
    if (!resolution) return LOWEST_RESOLUTION;

    return resolution.resolution;
  }
}
