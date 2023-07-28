import { web3, AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import HousesStakeIdl from './houses_stake.json' assert { type: 'json' };
import HousesTokenKeeperIdl from './houses_token_keeper.json' assert { type: 'json' };
import fetch from 'node-fetch';

const AWS_SECRETS_EXTENTION_HTTP_PORT = 2773;
const AWS_SECRETS_EXTENTION_SERVER_ENDPOINT = `http://localhost:${AWS_SECRETS_EXTENTION_HTTP_PORT}/secretsmanager/get?secretId=`;

const payerPublicKey = new web3.PublicKey(
  'Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2'
);

export const stakeProgramAdress = new web3.PublicKey(
  'HcKTgUbL976hsP7ie2LYLC92DFWcE6z4LSnjshC6hgcF'
);

const tokenKeeperProgramAdress = new web3.PublicKey(
  'BnHCabsYvwUPEkd22RMbk2y5g8XSgbhU435yGVik12vc'
);

export const tokenMint = new web3.PublicKey(
  '7Z7FPs9tM3k9zVyWuKCfJ8g4D54qaKTdx942hkxc7qii'
);

export const rewardMint = new web3.PublicKey(
  'DKgvB5LHdG7DUreqER5vNzySDwZfqzMamxe2KBTNqZgq'
);

export const getPayer = async () => {
  const url = `${AWS_SECRETS_EXTENTION_SERVER_ENDPOINT}dev/secret`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Error occured while requesting secret dev/secret. Responses status was ${response.status}`
    );
  }

  const secretContent = await response.json();
  const secret = JSON.parse(JSON.parse(secretContent.SecretString).secret);
  return web3.Keypair.fromSecretKey(new Uint8Array(secret));
};

export const getConnection = () =>
  new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');

const getProvider = async () => {
  const connection = getConnection();
  const wallet = new Wallet(await getPayer());
  const provider = new AnchorProvider(connection, wallet, 'confirmed');
  return provider;
};

export const getStakeProgram = async () => {
  return new Program(HousesStakeIdl, stakeProgramAdress, await getProvider());
};

export const getTokenKeeperProgram = async () => {
  return new Program(
    HousesTokenKeeperIdl,
    tokenKeeperProgramAdress,
    await getProvider()
  );
};

export const getUserPda = (email) => {
  const [userPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from(email, 'utf8'), payerPublicKey.toBuffer()],
    tokenKeeperProgramAdress
  );
  return userPda;
};

export const getStakePda = (email) => {
  const [stakePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('stake', 'utf8'), getUserPda(email).toBuffer()],
    stakeProgramAdress
  );
  return stakePda;
};

export const getDataPda = () => {
  const [dataPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('data', 'utf8'), payerPublicKey.toBuffer()],
    stakeProgramAdress
  );
  return dataPda;
};

export const getTokenAccount = async (owner, isPda = false, mint = tokenMint) =>
  await getOrCreateAssociatedTokenAccount(
    getConnection(),
    await getPayer(),
    mint,
    owner,
    isPda
  );
