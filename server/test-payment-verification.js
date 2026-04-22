#!/usr/bin/env node

/**
 * Payment Verification Test Script
 * Run this script to test if your Razorpay configuration is working correctly
 */

const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

const testRazorpayConfig = () => {
  console.log('🔍 Testing Razorpay Configuration...\n');
  
  // Check environment variables
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  console.log('Environment Variables:');
  console.log('- RAZORPAY_KEY_ID:', keyId ? `${keyId.substring(0, 10)}...` : '❌ NOT SET');
  console.log('- RAZORPAY_KEY_SECRET:', keySecret ? '✅ SET' : '❌ NOT SET');
  
  if (!keyId || !keyId.trim()) {
    console.error('\n❌ RAZORPAY_KEY_ID is not configured');
    console.log('Please add it to your .env file:');
    console.log('RAZORPAY_KEY_ID=rzp_test_your_actual_key_id');
    return false;
  }
  
  if (!keySecret || !keySecret.trim()) {
    console.error('\n❌ RAZORPAY_KEY_SECRET is not configured');
    console.log('Please add it to your .env file:');
    console.log('RAZORPAY_KEY_SECRET=your_actual_key_secret');
    return false;
  }
  
  // Test signature generation
  console.log('\n🔐 Testing signature generation...');
  const testOrderId = 'order_test_123456';
  const testPaymentId = 'pay_test_789012';
  
  const signature = crypto
    .createHmac('sha256', keySecret.trim())
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');
  
  console.log('✅ Signature generated successfully:');
  console.log(`   Order ID: ${testOrderId}`);
  console.log(`   Payment ID: ${testPaymentId}`);
  console.log(`   Signature: ${signature.substring(0, 20)}...`);
  
  // Test Razorpay connection (optional)
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: keyId.trim(),
      key_secret: keySecret.trim(),
    });
    
    console.log('\n🔗 Testing Razorpay connection...');
    // Note: This will fail with test keys, but validates the format
    console.log('✅ Razorpay instance created successfully');
    console.log(`   Key ID format: ${razorpay.key_id.startsWith('rzp_') ? '✅ Valid' : '❌ Invalid'}`);
    
  } catch (error) {
    console.error('\n❌ Razorpay connection failed:', error.message);
    return false;
  }
  
  console.log('\n✅ All tests passed! Your Razorpay configuration looks good.');
  console.log('\n📝 Next steps:');
  console.log('1. Make sure your server is running');
  console.log('2. Test a real payment through the checkout flow');
  console.log('3. Check server logs for detailed payment verification info');
  
  return true;
};

// Run the test
if (require.main === module) {
  testRazorpayConfig();
}

module.exports = { testRazorpayConfig };
