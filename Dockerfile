FROM node:lts-alpine
ARG BUILD_DEPS="git g++ cmake make python2"
WORKDIR /opt/leap-node
RUN apk add --no-cache --update --virtual build_deps $BUILD_DEPS
COPY . /opt/leap-node
RUN chmod 755 bin.js
RUN npm install --production --no-package-lock yarn
RUN ./node_modules/.bin/yarn install --production
RUN ./node_modules/.bin/yarn link
RUN apk del build_deps
CMD ["leap-node", \
  "--config=https://testnet-node1.leapdao.org/", \
  "--p2pPort=46691", \
  "--rpcaddr=0.0.0.0", \
  "--rpcport=8645", \
  "--wsaddr=0.0.0.0", \
  "--wsport=8646" \
]
