/**
 * 测试 Ed25519 签名对比
 * 对比 TweetNaCl 和 @noble/curves 的签名结果
 */

import nacl from 'tweetnacl';
import { ed25519 } from '@noble/curves/ed25519.js';

// 测试数据（从日志中提取）
const testSecret = 'ta4KSL5av30iDTYO'; // 替换为实际的 App Secret
const eventTs = '1760526162';
const plainToken = 'K6jxC2PFcBVpaifTmOvf';
const expectedSignature = '8795356377b0e83a9dbcd0d101b9d44f352a6aaaf068787571917e7f6830c1175e340997451bb83dfbefa55d9cd35dcadfeb95ad65faf06222251139703fc50b';

console.log('='.repeat(80));
console.log('Ed25519 签名对比测试');
console.log('='.repeat(80));
console.log();

// 1. TweetNaCl 方式（参考实现）
console.log('1️⃣  TweetNaCl 实现:');
console.log('-'.repeat(80));

function generateKeyPair(seed) {
  let finalSeed = seed;
  while (finalSeed.length < 32) {
    finalSeed = finalSeed.repeat(2);
  }
  finalSeed = finalSeed.slice(0, 32);
  const seedBuffer = Buffer.from(finalSeed, 'utf-8');
  const keyPair = nacl.sign.keyPair.fromSeed(seedBuffer);
  return keyPair;
}

function signMessageNaCl(privateKey, eventTs, plainToken) {
  const message = eventTs + plainToken;
  const messageBytes = Buffer.from(message, 'utf-8');
  const signature = nacl.sign.detached(messageBytes, privateKey);
  return Buffer.from(signature).toString('hex');
}

const { secretKey: naclSecretKey, publicKey: naclPublicKey } = generateKeyPair(testSecret);
console.log('种子 (前32字节):', Buffer.from(naclSecretKey.slice(0, 32)).toString('hex').substring(0, 32) + '...');
console.log('私钥长度:', naclSecretKey.length, '字节');
console.log('公钥长度:', naclPublicKey.length, '字节');
console.log('公钥 (hex):', Buffer.from(naclPublicKey).toString('hex'));

const naclSignature = signMessageNaCl(naclSecretKey, eventTs, plainToken);
console.log('签名结果:', naclSignature);
console.log();

// 2. @noble/curves 方式（当前实现）
console.log('2️⃣  @noble/curves 实现 (当前):');
console.log('-'.repeat(80));

function deriveSeed(secret) {
  let finalSeed = secret;
  while (finalSeed.length < 32) {
    finalSeed = finalSeed.repeat(2);
  }
  finalSeed = finalSeed.slice(0, 32);
  return new TextEncoder().encode(finalSeed);
}

const nobleSeed = deriveSeed(testSecret);
console.log('种子长度:', nobleSeed.length, '字节');
console.log('种子 (hex):', Buffer.from(nobleSeed).toString('hex').substring(0, 32) + '...');

const noblePublicKey = ed25519.getPublicKey(nobleSeed);
console.log('公钥长度:', noblePublicKey.length, '字节');
console.log('公钥 (hex):', Buffer.from(noblePublicKey).toString('hex'));

const message = eventTs + plainToken;
const messageBytes = new TextEncoder().encode(message);
const nobleSignature = ed25519.sign(messageBytes, nobleSeed);
const nobleSignatureHex = Buffer.from(nobleSignature).toString('hex');
console.log('签名结果:', nobleSignatureHex);
console.log();

// 3. 对比结果
console.log('3️⃣  对比结果:');
console.log('-'.repeat(80));
console.log('TweetNaCl 签名:  ', naclSignature);
console.log('@noble/curves 签名:', nobleSignatureHex);
console.log('预期签名:        ', expectedSignature);
console.log();

const naclMatch = naclSignature === expectedSignature;
const nobleMatch = nobleSignatureHex === expectedSignature;

console.log('TweetNaCl 匹配:', naclMatch ? '✅ 是' : '❌ 否');
console.log('@noble/curves 匹配:', nobleMatch ? '✅ 是' : '❌ 否');
console.log();

// 4. 公钥对比
console.log('4️⃣  公钥对比:');
console.log('-'.repeat(80));
const publicKeyMatch = Buffer.from(naclPublicKey).toString('hex') === Buffer.from(noblePublicKey).toString('hex');
console.log('公钥是否一致:', publicKeyMatch ? '✅ 是' : '❌ 否');
console.log();

if (!publicKeyMatch) {
  console.log('⚠️  问题：公钥不一致！');
  console.log('TweetNaCl 使用 keyPair.fromSeed 生成的是完整密钥对');
  console.log('@noble/curves 使用种子直接作为私钥');
  console.log();
}

// 5. 验证签名
console.log('5️⃣  验证签名:');
console.log('-'.repeat(80));

// 使用 TweetNaCl 验证
const naclVerify = nacl.sign.detached.verify(
  messageBytes,
  Buffer.from(naclSignature, 'hex'),
  naclPublicKey
);
console.log('TweetNaCl 验证自己的签名:', naclVerify ? '✅ 通过' : '❌ 失败');

// 使用 @noble/curves 验证
try {
  const nobleVerify = ed25519.verify(
    Buffer.from(nobleSignatureHex, 'hex'),
    messageBytes,
    noblePublicKey
  );
  console.log('@noble/curves 验证自己的签名:', nobleVerify ? '✅ 通过' : '❌ 失败');
} catch (error) {
  console.log('@noble/curves 验证失败:', error.message);
}

console.log();
console.log('='.repeat(80));

// 结论
if (naclMatch && !nobleMatch) {
  console.log('❌ 结论: @noble/curves 的实现有问题，需要修复');
  console.log('💡 建议: 应该使用 TweetNaCl 的实现方式');
} else if (!naclMatch && nobleMatch) {
  console.log('✅ 结论: @noble/curves 的实现正确');
} else if (naclMatch && nobleMatch) {
  console.log('✅ 结论: 两种实现都正确！');
} else {
  console.log('❓ 结论: 需要检查测试数据');
}
console.log('='.repeat(80));

