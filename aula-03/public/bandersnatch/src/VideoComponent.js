export default class VideoComponent {
  constructor() {
    this.modal = {};
  }

  initializePlayer() {
    const player = videojs('vid');
    const ModalDialog = videojs.getComponent('ModalDialog');
    const modal = new ModalDialog(player, {
      temporary: false,
      closeable: true,
    });

    player.addChild(modal);

    player.on('play', () => modal.close());

    this.modal = modal;
  }

  makeModalTemplate(options) {
    return `
      <div class="overlay">
        <div class="videoButtonWrapper">
          ${options
            .map(
              (option) =>
                `<button class="btn btn-dark" onclick="window.nextChunk('${option}')">${option}</button>`,
            )
            .join('\n')}
        </div>
      </div>
    `;
  }

  getModalTemplate(options, modal) {
    return (_) => {
      const htmlTemplate = this.makeModalTemplate(options);
      modal.contentEl().innerHTML = htmlTemplate;
    };
  }

  configureModal(selected) {
    const modal = this.modal;
    modal.on('modalopen', this.getModalTemplate(selected, modal));

    modal.open();
    window.modal = modal;
  }
}
