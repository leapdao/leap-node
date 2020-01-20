#!/usr/bin/env node

const { createHash } = require('crypto');
const {
  createWriteStream,
  readFileSync,
  renameSync,
  accessSync,
  copyFileSync,
} = require('fs');
const { join, dirname } = require('path');
const { get } = require('axios');
const unzip = require('unzipper').Parse;
const mkdirp = require('mkdirp').sync;

const versionPath = join(__dirname, 'version');
const tendermintVersion = readFileSync(versionPath, 'utf8').trim();
const binPath = join(__dirname, 'tendermint');
const binaryDownloadUrl = getBinaryDownloadURL(tendermintVersion);

console.log(`downloading ${binaryDownloadUrl}`);

get(binaryDownloadUrl, { responseType: 'stream' }).then(res => {
  if (res.status !== 200) {
    throw Error(`Request failed, status: ${res.status}`);
  }

  const hasher = createHash('sha256');
  const length = parseInt(res.headers['content-length']);
  const tempBinPath = join(__dirname, '_tendermint');
  // unzip, write to file, and check hash
  const file = createWriteStream(tempBinPath, { mode: 0o755 });

  res.data.pipe(unzip()).once('entry', entry => {
    // write to a temporary file which we rename if the hash check passes
    entry.pipe(file);
  });

  // verify hash of file
  res.data.on('data', chunk => hasher.update(chunk));
  file.on('finish', () => {
    const actualHash = hasher.digest().toString('hex');
    const expectedHash = getExpectedHash(binaryDownloadUrl);

    if (actualHash !== expectedHash) {
      console.error(
        'ERROR: hash of downloaded tendermint binary did not match. Got %s, expected %s',
        actualHash,
        expectedHash
      );
      process.exit(1);
    }

    console.log('✅ verified hash of tendermint binary\n');
    renameSync(tempBinPath, binPath);
  });

  res.data.on('data', () => process.stdout.write('.'));
  res.data.on('end', () => console.log());
});

// gets a URL to the binary zip, hosted on GitHub
function getBinaryDownloadURL(version) {
  const platforms = {
    darwin: 'darwin',
    linux: 'linux',
    win32: 'windows',
    freebsd: 'freebsd',
  };
  const arches = {
    x32: '386',
    ia32: '386',
    x64: 'amd64',
    arm: 'arm',
    arm64: 'arm',
  };
  const platform = platforms[process.platform];
  const arch = arches[process.arch];

  return `https://github.com/leapdao/tendermint/releases/download/${version}/tendermint_${version}_${platform}_${arch}.zip`;
}

function getExpectedHash(binaryDownloadUrl) {
  // get known hash from SHA256SUMS file
  const shasumPath = join(__dirname, 'SHA256SUMS');
  const shasums = readFileSync(shasumPath).toString();

  for (const line of shasums.split('\n')) {
    const [shasum, filename] = line.split(/\s+/);
    if (binaryDownloadUrl.includes(filename)) {
      return shasum;
    }
  }
}
