import {
  getPayer,
  getTokenKeeperProgram,
  getUserPda,
  getTokenAccount,
  tokenMint,
} from '/opt/utils.mjs';
import anchor from '/opt/nodejs/node_modules/@coral-xyz/anchor/dist/cjs/index.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '/opt/nodejs/node_modules/@solana/spl-token/lib/cjs/index.js';
const { BN, web3 } = anchor;

export const handler = async (event) => {
  const { amount, recipient } = JSON.parse(event.body);
  const { email } = event.requestContext.authorizer.claims;
  if (!email) {
    return {
      statusCode: 400,
    };
  }
  const payer = await getPayer();
  const tokenKeeperProgram = await getTokenKeeperProgram();

  const userPda = await getUserPda(email);
  const userPdaTokenAccount = await getTokenAccount(userPda, true);
  const recipientPublicKey = new web3.PublicKey(recipient);
  const recipientTokenAccount = await getTokenAccount(recipientPublicKey);
  await tokenKeeperProgram.methods
    .output(email, new BN(amount))
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMint,
      userPda,
      userPdaTokenAccount: userPdaTokenAccount.address,
      recipient: recipientPublicKey,
      recipientTokenAccount: recipientTokenAccount.address,
      authority: payer.publicKey,
    })
    .signers([payer])
    .rpc();
  const response = {
    statusCode: 200,
  };
  return response;
};
