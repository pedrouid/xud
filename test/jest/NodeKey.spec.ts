import secp256k1 from 'secp256k1';
import NodeKey from '../../lib/nodekey/NodeKey';
import { randomBytes } from '../../lib/utils/utils';
import { getTempDir } from '../utils';

function validateNodeKey(nodeKey: NodeKey) {
  expect(nodeKey.pubKey).toHaveLength(66);
  expect(secp256k1.privateKeyVerify(nodeKey['privKey'])).toEqual(true);
  expect(secp256k1.publicKeyVerify(Buffer.from(nodeKey.pubKey, 'hex'))).toEqual(true);
}

describe('NodeKey', () => {
  test('it should generate a valid node key', async () => {
    const nodeKey = await NodeKey['generate']();
    validateNodeKey(nodeKey);
  });

  test('it should write a nodekey to disk and read it back without encryption', async () => {
    const nodeKey = await NodeKey['generate']();
    const path = NodeKey.getPath(getTempDir(true));
    await nodeKey.toFile(path);
    const nodeKeyFromDisk = await NodeKey.fromFile(path);
    expect(nodeKey.privKey.compare(nodeKeyFromDisk.privKey)).toEqual(0);
  });

  test('it should write a nodekey to disk and read it back with encryption', async () => {
    const password = 'wasspord';
    const nodeKey = await NodeKey['generate']();
    const path = NodeKey.getPath(getTempDir(true));
    await nodeKey.toFile(path, password);
    const nodeKeyFromDisk = await NodeKey.fromFile(path, password);
    expect(nodeKey.privKey.compare(nodeKeyFromDisk.privKey)).toEqual(0);
  });

  test('it should write a nodekey to disk with encryption and fail reading it with the wrong password', async () => {
    const password = 'wasspord';
    const nodeKey = await NodeKey['generate']();
    const path = NodeKey.getPath(getTempDir(true));
    await nodeKey.toFile(path, password);
    await expect(NodeKey.fromFile(path, 'wrongpassword')).rejects.toThrow();
  });

  test('it should create a valid nodekey from a 32 byte buffer', async () => {
    // we can't use allocUnsafe here because creating a nodekey from 32 bytes of zeros will fail
    // instead we generate 32 random bytes that ~never will be all 0s, unlike allocUnsafe
    const nodeKey = NodeKey.fromBytes(await randomBytes(32));
    validateNodeKey(nodeKey);
  });

  test('it should error when creating a nodekey from a 32 zeroed bytes', () => {
    expect(() => NodeKey.fromBytes(Buffer.alloc(32))).toThrowError('private was invalid, try again');
  });

  test('it should create a valid nodekey from a greater than 32 byte buffer', async () => {
    const nodeKey = NodeKey.fromBytes(await randomBytes(42));
    validateNodeKey(nodeKey);
  });

  test('it should create a valid nodekey from a lesser than 32 byte buffer', async () => {
    const nodeKey = NodeKey.fromBytes(await randomBytes(22));
    validateNodeKey(nodeKey);
  });
});
