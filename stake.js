import anchor from '/opt/nodejs/node_modules/@coral-xyz/anchor/dist/cjs/index.js';
import {
  getPayer,
  getStakeProgram,
  getTokenKeeperProgram,
  getDataPda,
  getUserPda,
  getStakePda,
  getTokenAccount,
  tokenMint,
} from '/opt/utils.mjs';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '/opt/nodejs/node_modules/@solana/spl-token/lib/cjs/index.js';
const { BN, web3 } = anchor;
export const handler = async (event) => {
  const { amount } = JSON.parse(event.body);
  const { email } = event.requestContext.authorizer.claims;
  if (!email) {
    return {
      statusCode: 400,
    };
  }
  const payer = await getPayer();
  const tokenKeeperProgram = await getTokenKeeperProgram();
  const stakeProgram = await getStakeProgram();

  const userPda = await getUserPda(email);
  const userPdaTokenAccount = await getTokenAccount(userPda, true);

  const stakePda = await getStakePda(email);

  const dataPda = await getDataPda();
  const stakeTokenAccount = await getTokenAccount(dataPda, true);

  try {
    await stakeProgram.account.stakePda.fetch(stakePda);
  } catch (e) {
    await stakeProgram.methods
      .signup()
      .accounts({
        systemProgram: web3.SystemProgram.programId,
        stakePda,
        userPda,
        authority: payer.publicKey,
      })
      .signers([payer])
      .rpc();
  }

  await tokenKeeperProgram.methods
    .stake(email, new BN(amount))
    .accounts({
      stakeProgram: stakeProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMint,
      userPda,
      userPdaTokenAccount: userPdaTokenAccount.address,
      stakePda,
      stakeTokenAccount: stakeTokenAccount.address,
      dataPda,
      authority: payer.publicKey,
    })
    .signers([payer])
    .rpc();
  const response = {
    statusCode: 200,
  };
  return response;
};
