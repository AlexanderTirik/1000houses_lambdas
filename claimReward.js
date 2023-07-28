import anchor from '/opt/nodejs/node_modules/@coral-xyz/anchor/dist/cjs/index.js';
import {
  getPayer,
  getStakeProgram,
  getTokenKeeperProgram,
  getDataPda,
  getUserPda,
  getStakePda,
  getTokenAccount,
  rewardMint,
  tokenMint,
} from '/opt/utils.mjs';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '/opt/nodejs/node_modules/@solana/spl-token/lib/cjs/index.js';
const { web3 } = anchor;
export const handler = async (event) => {
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
  const userRewardTokenAccount = await getTokenAccount(
    userPda,
    true,
    rewardMint
  );

  const stakePda = await getStakePda(email);

  const dataPda = await getDataPda();
  const rewardTokenAccount = await getTokenAccount(userPda, true, rewardMint);

  await tokenKeeperProgram.methods
    .claimReward(email)
    .accounts({
      stakeProgram: stakeProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rewardMint,
      tokenMint,
      stakePda,
      dataPda,
      userPda,
      userRewardTokenAccount,
      rewardTokenAccount: rewardTokenAccount.address,
      authority: payer.publicKey,
    })
    .signers([payer])
    .rpc();
  const response = {
    statusCode: 200,
  };
  return response;
};
