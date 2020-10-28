import Network from './src/Network.js';
import VideoComponent from './src/VideoComponent.js';
import VideoMediaPlayer from './src/VideoMediaPlayer.js';

const MANIFEST_URL = 'manifest.json';
const localHosts = ['127.0.0.1', 'localhost'];

async function main() {
  const isLocal = localHosts.includes(window.location.hostname);
  const manifestJSON = await (await fetch(MANIFEST_URL)).json();
  const host = isLocal ? manifestJSON.localHost : manifestJSON.productionHost;

  const videoComponent = new VideoComponent();
  videoComponent.initializePlayer();

  const network = new Network(host);

  const videoMediaPlayer = new VideoMediaPlayer({
    manifest: manifestJSON,
    network,
  });
  videoMediaPlayer.initializeCodec();
}

window.onload = main;
