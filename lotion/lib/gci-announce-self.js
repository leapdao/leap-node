// function to start full nodes announcing themselves for light clients or peers
const { createServer } = require('peer-channel');

function announceFullNodeGCI({ GCI, tendermintPort }) {
  const server = createServer(socket => {
    socket.send(String(tendermintPort));
    socket.end();

    socket.on('error', () => {});
  });

  server.listen(`fullnode:${GCI}`);
}

module.exports = announceFullNodeGCI;
