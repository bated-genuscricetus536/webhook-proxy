/**
 * WebAuthn (Passkey) 工具函数
 * 使用 @simplewebauthn/server v13
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';

/**
 * 生成注册选项
 */
export async function generatePasskeyRegistrationOptions(
  userId: string,
  username: string,
  rpID: string,
  rpName: string = 'Webhook Proxy'
) {
  // 转换 userId 为 Uint8Array
  const userIDBuffer = new TextEncoder().encode(userId);
  
  return await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userIDBuffer as Uint8Array<ArrayBuffer>,
    userName: username,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
}

/**
 * 验证注册响应
 */
export async function verifyPasskeyRegistration(
  response: any,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string
): Promise<VerifiedRegistrationResponse> {
  return await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
  });
}

/**
 * 生成认证选项
 */
export async function generatePasskeyAuthenticationOptions(
  rpID: string,
  allowCredentials?: Array<{ id: string; type: 'public-key' }>
) {
  return await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: allowCredentials as any,
  });
}

/**
 * 验证认证响应
 */
export async function verifyPasskeyAuthentication(
  response: any,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  credential: {
    id: string;
    publicKey: Uint8Array;
    counter: number;
  }
): Promise<VerifiedAuthenticationResponse> {
  return await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    credential: {
      id: credential.id,
      publicKey: credential.publicKey as Uint8Array<ArrayBuffer>,
      counter: credential.counter,
    },
  });
}
