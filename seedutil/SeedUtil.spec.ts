import { exec } from 'child_process';
import { promises as fs, existsSync, lstatSync } from 'fs';

const executeCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      } else {
        if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      }
    });
  });
};

const deleteDir = async (path: string) => {
  try {
    if (existsSync(path)) {
      // delete all the files first because
      // fs.rmdir is non-recursive
      const files = await fs.readdir(path);
      const deletePromises: Promise<void>[] = [];
      files.forEach((file) => {
        if (lstatSync(`${path}/${file}`).isDirectory()) { // recurse
          deletePromises.push(deleteDir(`${path}/${file}`));
        } else { // delete file
          deletePromises.push(fs.unlink(`${path}/${file}`));
        }
      });
      await Promise.all(deletePromises);
      // delete directory
      await fs.rmdir(path);
    }
  } catch (e) {
    throw new Error(`unable to clear keystore folder: ${e}`);
  }
};

const SUCCESS_KEYSTORE_CREATED = 'Keystore created';
const ERRORS = {
  INVALID_ARGS_LENGTH: 'expecting 24-word mnemonic seed separated by spaces',
  MISSING_ENCRYPTION_PASSWORD: 'expecting encryption password',
  INVALID_AEZEED: 'invalid aezeed',
  KEYSTORE_FILE_ALREADY_EXISTS: 'account already exists',
  INVALID_PASSPHRASE: 'invalid passphrase',
};

const PASSWORD = 'wasspord';

const VALID_SEED = {
  seedPassword: 'mysecretpassword',
  seedWords: [
    'abstract', 'gossip', 'rubber', 'wool', 'trash', 'wisdom',
    'home', 'grass', 'prepare', 'frequent', 'diary', 'police',
    'direct', 'cheap', 'exhibit', 'box', 'lens', 'absorb',
    'speak', 'admit', 'pyramid', 'transfer', 'define', 'antenna',
  ],
  ethAddress: '23ccdcd149bd433d64987ffebbc88ac909842303',
};

const VALID_SEED_NO_PASS = {
  seedWords: [
    'abstract', 'swear', 'air', 'swamp', 'carpet', 'that',
    'retire', 'pool', 'produce', 'food', 'join', 'inform',
    'giraffe', 'local', 'region', 'anchor', 'march', 'advice',
    'blanket', 'quick', 'farm', 'mandate', 'shell', 'lens',
  ],
  ethAddress: 'e650ced4be22e305bd133a0b7f8e50b9c5568c57',
};

const DEFAULT_KEYSTORE_PATH = `${process.cwd()}/seedutil/keystore`;

describe('SeedUtil encipher', () => {
  test('it errors with no arguments', async () => {
    await expect(executeCommand('./seedutil/seedutil encipher'))
      .rejects.toThrow(ERRORS.INVALID_ARGS_LENGTH);
  });

  test('it errors with 23 words', async () => {
    const cmd = `./seedutil/seedutil encipher ${VALID_SEED.seedWords.slice(0, 23).join(' ')}`;
    await expect(executeCommand(cmd))
      .rejects.toThrow(ERRORS.INVALID_ARGS_LENGTH);
  });

  test('it errors with 24 words and invalid aezeed password', async () => {
    const cmd = `./seedutil/seedutil encipher ${VALID_SEED.seedWords.join(' ')}`;
    await expect(executeCommand(cmd))
      .rejects.toThrow(ERRORS.INVALID_AEZEED);
  });

  test('it succeeds with 24 words, valid aezeed password', async () => {
    const cmd = `./seedutil/seedutil encipher -aezeedpass=${VALID_SEED.seedPassword} ${VALID_SEED.seedWords.join(' ')}`;
    await expect(executeCommand(cmd)).resolves.toMatchSnapshot();
  });

  test('it succeeds with 24 words, no aezeed password', async () => {
    const cmd = `./seedutil/seedutil encipher ${VALID_SEED_NO_PASS.seedWords.join(' ')}`;
    await expect(executeCommand(cmd)).resolves.toMatchSnapshot();
  });
});

describe('SeedUtil decipher', () => {
  test('it errors with no arguments', async () => {
    await expect(executeCommand('./seedutil/seedutil decipher'))
      .rejects.toThrow(ERRORS.INVALID_ARGS_LENGTH);
  });

  test('it errors with 23 words', async () => {
    const cmd = `./seedutil/seedutil decipher ${VALID_SEED.seedWords.slice(0, 23).join(' ')}`;
    await expect(executeCommand(cmd))
      .rejects.toThrow(ERRORS.INVALID_ARGS_LENGTH);
  });

  test('it errors with 24 words and invalid aezeed password', async () => {
    const cmd = `./seedutil/seedutil decipher ${VALID_SEED.seedWords.join(' ')}`;
    await expect(executeCommand(cmd))
      .rejects.toThrow(ERRORS.INVALID_PASSPHRASE);
  });

  test('it succeeds with 24 words, valid aezeed password', async () => {
    const cmd = `./seedutil/seedutil decipher -aezeedpass=${VALID_SEED.seedPassword} ${VALID_SEED.seedWords.join(' ')}`;
    await expect(executeCommand(cmd)).resolves.toMatchSnapshot();
  });

  test('it succeeds with 24 words, no aezeed password', async () => {
    const cmd = `./seedutil/seedutil decipher ${VALID_SEED_NO_PASS.seedWords.join(' ')}`;
    await expect(executeCommand(cmd)).resolves.toMatchSnapshot();
  });
});

describe('SeedUtil keystore', () => {
  beforeEach(async () => {
    await deleteDir(DEFAULT_KEYSTORE_PATH);
  });

  test('it errors with no arguments', async () => {
    await expect(executeCommand('./seedutil/seedutil keystore'))
      .rejects.toThrow(ERRORS.INVALID_ARGS_LENGTH);
  });

  test('it errors with 23 words', async () => {
    const cmd = `./seedutil/seedutil keystore ${VALID_SEED.seedWords.slice(0, 23).join(' ')}`;
    await expect(executeCommand(cmd))
      .rejects.toThrow(ERRORS.INVALID_ARGS_LENGTH);
  });

  test('it errors with 24 words and invalid aezeed password', async () => {
    const cmd = `./seedutil/seedutil keystore ${VALID_SEED.seedWords.join(' ')}`;
    await expect(executeCommand(cmd))
      .rejects.toThrow(ERRORS.INVALID_AEZEED);
  });

  test('it succeeds with 24 words, valid aezeed password', async () => {
    const cmd = `./seedutil/seedutil keystore -aezeedpass=${VALID_SEED.seedPassword} ${VALID_SEED.seedWords.join(' ')}`;
    await expect(executeCommand(cmd))
      .resolves.toMatch(SUCCESS_KEYSTORE_CREATED);
    // Read our keystore file
    const files = await fs.readdir(DEFAULT_KEYSTORE_PATH);
    expect(files.length).toEqual(1);
    const keyStorePath = `${DEFAULT_KEYSTORE_PATH}/${files[0]}`;
    const keyStoreObj = JSON.parse(await fs.readFile(keyStorePath, 'utf8'));
    // verify that the derived ETH address matches
    expect(keyStoreObj.address).toEqual(VALID_SEED.ethAddress);
    // running it again should cause it to fail
    // because keystore file already exists
    await expect(executeCommand(cmd))
      .rejects.toThrow(ERRORS.KEYSTORE_FILE_ALREADY_EXISTS);
  });

  test('it succeeds with 24 words, no aezeed password', async () => {
    const cmd = `./seedutil/seedutil keystore ${VALID_SEED_NO_PASS.seedWords.join(' ')}`;
    await expect(executeCommand(cmd))
      .resolves.toMatch(SUCCESS_KEYSTORE_CREATED);
    // Read our keystore file
    const files = await fs.readdir(DEFAULT_KEYSTORE_PATH);
    expect(files.length).toEqual(1);
    const keyStorePath = `${DEFAULT_KEYSTORE_PATH}/${files[0]}`;
    const keyStoreObj = JSON.parse(await fs.readFile(keyStorePath, 'utf8'));
    // verify that the derived ETH address matches
    expect(keyStoreObj.address).toEqual(VALID_SEED_NO_PASS.ethAddress);
  });

  test('it succeeds with 24 word and encryption password', async () => {
    const cmd = `./seedutil/seedutil keystore -pass=${PASSWORD} ${VALID_SEED_NO_PASS.seedWords.join(' ')}`;
    await expect(executeCommand(cmd))
      .resolves.toMatch(SUCCESS_KEYSTORE_CREATED);
    // Read our keystore file
    const files = await fs.readdir(DEFAULT_KEYSTORE_PATH);
    expect(files.length).toEqual(1);
    const keyStorePath = `${DEFAULT_KEYSTORE_PATH}/${files[0]}`;
    const keyStoreObj = JSON.parse(await fs.readFile(keyStorePath, 'utf8'));
    // verify that the derived ETH address matches
    expect(keyStoreObj.address).toEqual(VALID_SEED_NO_PASS.ethAddress);
  });

  test('it allows custom keystore save path', async () => {
    const CUSTOM_PATH = `${process.cwd()}/seedutil/custom`;
    const cmd = `./seedutil/seedutil keystore -path=${CUSTOM_PATH} -aezeedpass=${VALID_SEED.seedPassword} ${VALID_SEED.seedWords.join(' ')}`;
    await expect(executeCommand(cmd))
      .resolves.toMatch(SUCCESS_KEYSTORE_CREATED);
    // cleanup custom path
    await deleteDir(CUSTOM_PATH);
  });
});
