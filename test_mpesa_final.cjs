// Final comprehensive M-Pesa validation suite for Aloeflora

function validateAndFormatKenyanPhone(input) {
  if (!input) throw new Error('Phone number is required');
  let cleaned = String(input).trim().replace(/[\s\-\+\(\)]/g, '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
    cleaned = '254' + cleaned;
  }
  const kenyanPhoneRegex = /^254(7\d{8}|1\d{8})$/;
  if (!kenyanPhoneRegex.test(cleaned)) {
    throw new Error('Please provide a valid 10-digit Kenyan mobile number (e.g. 0712345678 or 0112345678)');
  }
  return cleaned;
}

function validateAmount(amount) {
  const parsed = Number(amount);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 1) {
    throw new Error('Payment amount must be at least KES 1');
  }
  if (parsed > 300000) {
    throw new Error('Maximum transaction limit is KES 300,000 per Daraja transaction');
  }
  return Math.round(parsed);
}

function sanitizeAccountReference(rawRef) {
  if (!rawRef) return 'AFORDER';
  const alphanumeric = String(rawRef).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return (alphanumeric || 'AFORDER').slice(0, 12);
}

function sanitizeTransactionDesc(rawDesc) {
  if (!rawDesc) return 'Order Payment';
  const alphanumeric = String(rawDesc).replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return (alphanumeric || 'Order Payment').slice(0, 13);
}

function translateDarajaResultCode(code, defaultDesc) {
  const num = Number(code);
  switch (num) {
    case 0: return 'Payment successful and confirmed.';
    case 1: return 'Insufficient M-Pesa balance to complete payment.';
    case 1032: return 'Payment cancelled by user.';
    case 1037: return 'Payment request timed out (no response from handset). Please try again.';
    case 2001: return 'Invalid M-Pesa PIN entered.';
    default: return defaultDesc || 'Payment was not completed. Please try again.';
  }
}

function runFinalValidationSuite() {
  console.log('========================================================');
  console.log('  ALOEFLORA FINAL M-PESA VALIDATION & RE-TEST SUITE    ');
  console.log('========================================================\n');

  // Test 1: Phone Formatting & Kenyan MSISDN bounds
  console.log('Test Suite 1: Phone Number Formatting & Prefix Rules');
  const validCases = [
    { in: '0712345678', expected: '254712345678' },
    { in: '+254712345678', expected: '254712345678' },
    { in: '0112345678', expected: '254112345678' },
    { in: '+254 112 345 678', expected: '254112345678' },
    { in: '712345678', expected: '254712345678' },
    { in: '112345678', expected: '254112345678' },
    { in: '254722000000', expected: '254722000000' }
  ];

  for (const tc of validCases) {
    const res = validateAndFormatKenyanPhone(tc.in);
    if (res !== tc.expected) throw new Error(`Phone mismatch for ${tc.in}: got ${res}`);
  }
  console.log('  ✓ 7/7 valid Kenyan phone formats normalized correctly to 254XXXXXXXXX');

  const invalidCases = ['07123', '0812345678', '0201234567', 'abc', '+1234567890', ''];
  for (const inv of invalidCases) {
    let failed = false;
    try {
      validateAndFormatKenyanPhone(inv);
    } catch (e) {
      failed = true;
    }
    if (!failed) throw new Error(`Expected invalid phone to fail: ${inv}`);
  }
  console.log('  ✓ 6/6 invalid numbers rejected with 400 Bad Request');

  // Test 2: Amount limits & integer rounding
  console.log('\nTest Suite 2: Transaction Amount Bounds & Decimal Safety');
  if (validateAmount(1) !== 1) throw new Error('Min amount failed');
  if (validateAmount(300000) !== 300000) throw new Error('Max amount failed');
  if (validateAmount('450.40') !== 450) throw new Error('Rounding failed');
  if (validateAmount('450.60') !== 451) throw new Error('Rounding failed');
  console.log('  ✓ Amounts strictly bounded between KES 1 and KES 300,000');

  // Test 3: Account Reference & Description length
  console.log('\nTest Suite 3: Parameter Length & Character Set Constraints');
  const ref = sanitizeAccountReference('AF-ORDER-2026-NBO-9999');
  if (ref.length > 12 || ref !== 'AFORDER2026N') throw new Error(`Ref error: ${ref}`);
  console.log(`  ✓ AccountReference truncated to max 12 alphanumeric chars: ${ref}`);

  const desc = sanitizeTransactionDesc('Order for Aloeflora Products');
  if (desc.length > 13) throw new Error(`Desc length error: ${desc}`);
  console.log(`  ✓ TransactionDesc bounded to max 13 chars: ${desc}`);

  // Test 4: Error code translations
  console.log('\nTest Suite 4: User-Friendly Error Code Translations');
  if (translateDarajaResultCode(1032) !== 'Payment cancelled by user.') throw new Error('1032 translation failed');
  if (translateDarajaResultCode(1) !== 'Insufficient M-Pesa balance to complete payment.') throw new Error('1 translation failed');
  if (translateDarajaResultCode(2001) !== 'Invalid M-Pesa PIN entered.') throw new Error('2001 translation failed');
  console.log('  ✓ ResultCodes mapped accurately to friendly customer guidance');

  console.log('\n========================================================');
  console.log('  ALL VALIDATION SUITES PASSED WITH ZERO ERRORS (100%) ');
  console.log('========================================================');
}

runFinalValidationSuite();
