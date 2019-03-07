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

ENV NO_VALIDATORS_UPDATES "false"
ENV TX_PORT "3000"
ENV RPC_ADDR "0.0.0.0"
ENV RPC_PORT "8645"
ENV WS_ADDR "0.0.0.0"
ENV WS_PORT "8646"
ENV P2P_PORT "46691"
ENV READONLY "false"
ENV UNSAFE_RPC "false"
ENV TENDERMINT_ADDR "0.0.0.0"
# Either CONFIG_URL or NETWORK needs to be defined, CONFIG_URL takes precedence
ENV CONFIG_URL "http://node1.testnet.leapdao.org:8645"
# for presets/leap-NETWORK
ENV NETWORK "testnet"
# Needed if validator
ENV PRIVATE_KEY ""
ENTRYPOINT ["leap-node"]
