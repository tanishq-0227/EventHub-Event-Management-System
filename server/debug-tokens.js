#!/usr/bin/env node

/**
 * Token Debug Tool
 * Helps debug JWT token issues
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const debugToken = (token) => {
  console.log('🔍 Debugging JWT Token...\n');
  
  if (!token) {
    console.error('❌ No token provided');
    console.log('Usage: node debug-tokens.js <your_jwt_token>');
    return;
  }

  try {
    // Check token structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT structure (should have 3 parts separated by dots)');
      return;
    }

    console.log('✅ Token structure is valid');
    console.log(`📝 Header: ${parts[0].substring(0, 20)}...`);
    console.log(`📝 Payload: ${parts[1].substring(0, 20)}...`);
    console.log(`📝 Signature: ${parts[2].substring(0, 20)}...`);

    // Decode payload (without verification)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('\n📋 Token Payload:');
    console.log('- User ID:', payload.id);
    console.log('- Role:', payload.role);
    console.log('- Issued At (iat):', new Date(payload.iat * 1000).toISOString());
    console.log('- Expires At (exp):', new Date(payload.exp * 1000).toISOString());
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    console.log('- Time Until Expiry:', timeUntilExpiry > 0 ? `${Math.round(timeUntilExpiry / 60)} minutes` : 'EXPIRED');

    // Verify with access secret
    console.log('\n🔐 Verifying with JWT_ACCESS_SECRET...');
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      console.log('✅ Token is valid with JWT_ACCESS_SECRET');
      console.log('- Verified User ID:', decoded.id);
      console.log('- Verified Role:', decoded.role);
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      if (error.name === 'TokenExpiredError') {
        console.log('💡 Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        console.log('💡 Invalid token signature or malformed');
      }
    }

    // Check environment variables
    console.log('\n🔧 Environment Variables:');
    console.log('- JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? '✅ SET' : '❌ NOT SET');
    console.log('- JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ SET' : '❌ NOT SET');
    console.log('- JWT_ACCESS_EXPIRES:', process.env.JWT_ACCESS_EXPIRES || '15m (default)');
    console.log('- JWT_REFRESH_EXPIRES:', process.env.JWT_REFRESH_EXPIRES || '7d (default)');

  } catch (error) {
    console.error('❌ Failed to decode token:', error.message);
  }
};

// Run if called directly
if (require.main === module) {
  const token = process.argv[2];
  debugToken(token);
}

module.exports = { debugToken };
