import test from 'node:test';
import assert from 'node:assert/strict';
import {
  firstNameSchema,
  middleNameSchema,
  lastNameSchema,
  emailSchema,
  panSchema,
  optionalPanSchema,
  aadhaarSchema,
  optionalAadhaarSchema,
  ifscSchema,
  optionalIfscSchema,
  bankAccountSchema,
  optionalBankAccountSchema,
  indianPhoneSchema,
  optionalIndianPhoneSchema,
  dobSchema,
  optionalDobSchema,
  calculateAge,
  isJoiningDateValidForDob,
  linkedinUrlSchema,
  githubUrlSchema,
  strongPasswordSchema,
  personNameSchema,
  maskPan,
  maskAadhaar,
  maskBankAccount,
  validateVerhoeff,
  generateVerhoeff,
  verifyMagicBytes,
  emergencyStepSchema,
  personalStepSchema,
  payrollStepSchema,
  accessStepSchema,
  UPLOAD_LIMITS,
  validatePersonalIdByGovtId,
  getGovtIdPlaceholder,
} from '../src/shared/validation/employee.ts';

// Helper to format local Date as YYYY-MM-DD avoiding UTC skew
function toLocalDateString(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// -------------------------------------------------------------
// 1. PAN Validation Tests
// -------------------------------------------------------------
test('PAN Validation: standard valid uppercase PAN', () => {
  const result = panSchema.safeParse('ABCDE1234F');
  assert.equal(result.success, true);
  assert.equal(result.data, 'ABCDE1234F');
});

test('PAN Validation: transforms lowercase to uppercase', () => {
  const result = panSchema.safeParse('abcde1234f');
  assert.equal(result.success, true);
  assert.equal(result.data, 'ABCDE1234F');
});

test('PAN Validation: trims surrounding spaces', () => {
  const result = panSchema.safeParse('  ABCDE1234F  ');
  assert.equal(result.success, true);
  assert.equal(result.data, 'ABCDE1234F');
});

test('PAN Validation: rejects invalid formats', () => {
  const invalidPans = ['ABCD1234F', 'ABCDE12345', '12345ABCDE', 'ABCDEF1234G', 'ABCDE123F', ''];
  for (const pan of invalidPans) {
    const result = panSchema.safeParse(pan);
    assert.equal(result.success, false, `Expected ${pan} to fail`);
  }
});

test('Optional PAN: accepts empty strings or null and returns undefined', () => {
  assert.equal(optionalPanSchema.safeParse('').data, undefined);
  assert.equal(optionalPanSchema.safeParse('   ').data, undefined);
  assert.equal(optionalPanSchema.safeParse(null).data, undefined);
  assert.equal(optionalPanSchema.safeParse(undefined).data, undefined);
});

test('PAN Masking: hides sensitive characters keeping last 4 digits', () => {
  assert.equal(maskPan('ABCDE1234F'), 'XXXXXX234F');
  assert.equal(maskPan(null), null);
});

// -------------------------------------------------------------
// 2. Aadhaar Validation Tests (with Verhoeff Checksum)
// -------------------------------------------------------------
test('Aadhaar Validation: generates and validates valid Verhoeff checksum', () => {
  const checksum = generateVerhoeff('23456789012');
  const validAadhaar = `23456789012${checksum}`;
  
  assert.equal(validateVerhoeff(validAadhaar), true);
  const result = aadhaarSchema.safeParse(validAadhaar);
  assert.equal(result.success, true);
  assert.equal(result.data, validAadhaar);
});

test('Aadhaar Validation: cleans spaces and hyphens before validating', () => {
  const checksum = generateVerhoeff('23456789012');
  const spaced = ` 2345-6789-012${checksum} `;
  const result = aadhaarSchema.safeParse(spaced);
  assert.equal(result.success, true);
  assert.equal(result.data, `23456789012${checksum}`);
});

test('Aadhaar Validation: rejects invalid checksum', () => {
  const checksum = generateVerhoeff('23456789012');
  const wrongChecksum = (checksum + 1) % 10;
  const invalidAadhaar = `23456789012${wrongChecksum}`;
  
  const result = aadhaarSchema.safeParse(invalidAadhaar);
  assert.equal(result.success, false);
});

test('Aadhaar Validation: rejects numbers starting with 0 or 1', () => {
  assert.equal(aadhaarSchema.safeParse('012345678901').success, false);
  assert.equal(aadhaarSchema.safeParse('123456789012').success, false);
});

test('Aadhaar Validation: rejects numbers with length != 12', () => {
  assert.equal(aadhaarSchema.safeParse('2345678901').success, false);
  assert.equal(aadhaarSchema.safeParse('2345678901234').success, false);
});

test('Optional Aadhaar: accepts empty string or null', () => {
  assert.equal(optionalAadhaarSchema.safeParse('').data, undefined);
  assert.equal(optionalAadhaarSchema.safeParse('  ').data, undefined);
  assert.equal(optionalAadhaarSchema.safeParse(null).data, undefined);
});

test('Aadhaar Masking: formats as XXXX-XXXX-Last4', () => {
  assert.equal(maskAadhaar('234567890125'), 'XXXX-XXXX-0125');
  assert.equal(maskAadhaar(null), null);
});

// -------------------------------------------------------------
// 3. IFSC Code Tests
// -------------------------------------------------------------
test('IFSC Code: valid 11-character code', () => {
  const result = ifscSchema.safeParse('HDFC0001234');
  assert.equal(result.success, true);
  assert.equal(result.data, 'HDFC0001234');
});

test('IFSC Code: transforms lowercase to uppercase', () => {
  const result = ifscSchema.safeParse('sbin0001234');
  assert.equal(result.success, true);
  assert.equal(result.data, 'SBIN0001234');
});

test('IFSC Code: rejects 5th character not being 0', () => {
  assert.equal(ifscSchema.safeParse('HDFC1001234').success, false);
  assert.equal(ifscSchema.safeParse('HDFCA001234').success, false);
});

test('IFSC Code: rejects invalid length or format', () => {
  assert.equal(ifscSchema.safeParse('HDF0001234').success, false);
  assert.equal(ifscSchema.safeParse('HDFC00012345').success, false);
});

test('Optional IFSC: accepts empty strings or null', () => {
  assert.equal(optionalIfscSchema.safeParse('').data, undefined);
  assert.equal(optionalIfscSchema.safeParse('   ').data, undefined);
  assert.equal(optionalIfscSchema.safeParse(null).data, undefined);
});

// -------------------------------------------------------------
// 4. Bank Account Number Tests
// -------------------------------------------------------------
test('Bank Account: accepts 9 to 18 digits', () => {
  assert.equal(bankAccountSchema.safeParse('123456789').success, true); // 9 digits
  assert.equal(bankAccountSchema.safeParse('123456789012345678').success, true); // 18 digits
  assert.equal(bankAccountSchema.safeParse(' 1234 5678 9012 ').data, '123456789012'); // cleaned spaces
});

test('Bank Account: rejects < 9 or > 18 digits or letters', () => {
  assert.equal(bankAccountSchema.safeParse('12345678').success, false); // 8 digits
  assert.equal(bankAccountSchema.safeParse('1234567890123456789').success, false); // 19 digits
  assert.equal(bankAccountSchema.safeParse('1234567890A').success, false); // contains letter
});

test('Optional Bank Account: accepts empty strings or null', () => {
  assert.equal(optionalBankAccountSchema.safeParse('').data, undefined);
  assert.equal(optionalBankAccountSchema.safeParse('  ').data, undefined);
  assert.equal(optionalBankAccountSchema.safeParse(null).data, undefined);
});

test('Bank Account Masking: masks all but last 4 digits', () => {
  assert.equal(maskBankAccount('123456789012'), 'XXXXXXXX9012');
  assert.equal(maskBankAccount(null), null);
});

// -------------------------------------------------------------
// 5. Indian Phone Number Tests
// -------------------------------------------------------------
test('Indian Phone: validates standard 10-digit phone starting with 6-9', () => {
  assert.equal(indianPhoneSchema.safeParse('9876543210').success, true);
  assert.equal(indianPhoneSchema.safeParse('8876543210').success, true);
  assert.equal(indianPhoneSchema.safeParse('7876543210').success, true);
  assert.equal(indianPhoneSchema.safeParse('6876543210').success, true);
});

test('Indian Phone: strips +91, 91, 0 prefixes and formatting characters', () => {
  assert.equal(indianPhoneSchema.safeParse('+91 98765 43210').data, '9876543210');
  assert.equal(indianPhoneSchema.safeParse('+91-9876543210').data, '9876543210');
  assert.equal(indianPhoneSchema.safeParse('09876543210').data, '9876543210');
  assert.equal(indianPhoneSchema.safeParse('919876543210').data, '9876543210');
});

test('Indian Phone: rejects numbers starting with 0-5', () => {
  assert.equal(indianPhoneSchema.safeParse('5876543210').success, false);
  assert.equal(indianPhoneSchema.safeParse('1234567890').success, false);
});

test('Indian Phone: rejects invalid lengths', () => {
  assert.equal(indianPhoneSchema.safeParse('987654321').success, false); // 9 digits
  assert.equal(indianPhoneSchema.safeParse('987654321000').success, false); // too long
});

test('Optional Indian Phone: accepts empty strings or null', () => {
  assert.equal(optionalIndianPhoneSchema.safeParse('').data, undefined);
  assert.equal(optionalIndianPhoneSchema.safeParse('   ').data, undefined);
  assert.equal(optionalIndianPhoneSchema.safeParse(null).data, undefined);
});

// -------------------------------------------------------------
// 6. Date of Birth & Age Tests
// -------------------------------------------------------------
test('DOB Validation: turning exactly 18 today is valid', () => {
  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const dobStr = toLocalDateString(eighteenYearsAgo);

  assert.equal(calculateAge(dobStr), 18);
  const result = dobSchema.safeParse(dobStr);
  assert.equal(result.success, true);
});

test('DOB Validation: turning 18 tomorrow is invalid (age 17)', () => {
  const today = new Date();
  const turningTomorrow = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
  const dobStr = toLocalDateString(turningTomorrow);

  assert.equal(calculateAge(dobStr), 17);
  const result = dobSchema.safeParse(dobStr);
  assert.equal(result.success, false);
});

test('DOB Validation: rejects future dates', () => {
  const today = new Date();
  const future = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const futureStr = toLocalDateString(future);

  const result = dobSchema.safeParse(futureStr);
  assert.equal(result.success, false);
});

test('Optional DOB: accepts empty strings or null', () => {
  assert.equal(optionalDobSchema.safeParse('').data, undefined);
  assert.equal(optionalDobSchema.safeParse(null).data, undefined);
});

// -------------------------------------------------------------
// 7. Joining Date vs DOB Rules
// -------------------------------------------------------------
test('Joining Date Rule: joining date must be >= DOB + 18y', () => {
  const dob = '2000-01-15';
  // 18th birthday is 2018-01-15
  assert.equal(isJoiningDateValidForDob(dob, '2018-01-15'), true);
  assert.equal(isJoiningDateValidForDob(dob, '2020-06-01'), true);
  assert.equal(isJoiningDateValidForDob(dob, '2018-01-14'), false);
  assert.equal(isJoiningDateValidForDob(dob, '2015-05-10'), false);
  assert.equal(isJoiningDateValidForDob(null, '2020-01-01'), true);
  assert.equal(isJoiningDateValidForDob('2000-01-01', null), true);
});

// -------------------------------------------------------------
// 8. Cross-Field Emergency Phone Rule
// -------------------------------------------------------------
test('Emergency Contact Step: rejects identical employee and emergency phone', () => {
  const stepData = {
    emergencyContactName: 'Jane Doe',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '+91 98765 43210',
    employeePhone: '9876543210',
  };

  const result = emergencyStepSchema.safeParse(stepData);
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /cannot be the same/i);
});

test('Emergency Contact Step: accepts different phone numbers', () => {
  const stepData = {
    emergencyContactName: 'Jane Doe',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '9876543211',
    employeePhone: '9876543210',
  };

  const result = emergencyStepSchema.safeParse(stepData);
  assert.equal(result.success, true);
});

// -------------------------------------------------------------
// 9. Profile URL Validation (LinkedIn & GitHub)
// -------------------------------------------------------------
test('LinkedIn Profile URL: validates strict profile URLs', () => {
  assert.equal(linkedinUrlSchema.safeParse('https://www.linkedin.com/in/someshwari-adeya').success, true);
  assert.equal(linkedinUrlSchema.safeParse('https://linkedin.com/in/john-doe-123/').success, true);
  assert.equal(linkedinUrlSchema.safeParse('http://linkedin.com/in/user_name').success, true);

  // Invalid LinkedIn URLs
  assert.equal(linkedinUrlSchema.safeParse('https://facebook.com/in/someshwari').success, false);
  assert.equal(linkedinUrlSchema.safeParse('https://linkedin.com/company/someshwari').success, false);
  assert.equal(linkedinUrlSchema.safeParse('not a url').success, false);
  assert.equal(linkedinUrlSchema.safeParse('').data, undefined); // empty optional
});

test('GitHub Profile URL: validates GitHub username profile URLs', () => {
  assert.equal(githubUrlSchema.safeParse('https://github.com/octocat').success, true);
  assert.equal(githubUrlSchema.safeParse('http://www.github.com/octo-cat').success, true);

  // Invalid GitHub URLs
  assert.equal(githubUrlSchema.safeParse('https://gitlab.com/octocat').success, false);
  assert.equal(githubUrlSchema.safeParse('https://github.com/octocat/repository').success, false);
  assert.equal(githubUrlSchema.safeParse('').data, undefined); // empty optional
});

// -------------------------------------------------------------
// 10. Strong Password Validation
// -------------------------------------------------------------
test('Password Validation: requires min 8 chars, uppercase, lowercase, digit', () => {
  assert.equal(strongPasswordSchema.safeParse('Admin@1234').success, true);
  assert.equal(strongPasswordSchema.safeParse('Welcome2026').success, true);

  // Invalid passwords
  assert.equal(strongPasswordSchema.safeParse('Short1A').success, false); // 7 chars
  assert.equal(strongPasswordSchema.safeParse('alllowercase123').success, false); // no uppercase
  assert.equal(strongPasswordSchema.safeParse('ALLUPPERCASE123').success, false); // no lowercase
  assert.equal(strongPasswordSchema.safeParse('NoDigitsPassword').success, false); // no digits
});

// -------------------------------------------------------------
// 11. Personal Information Fields (First, Middle, Last Name, Email, Phone)
// -------------------------------------------------------------
test('First Name: valid examples and Unicode support (Indian regional scripts)', () => {
  assert.equal(firstNameSchema.safeParse('Saikiran').data, 'Saikiran');
  assert.equal(firstNameSchema.safeParse('Sai   Kiran').data, 'Sai Kiran'); // multiple spaces collapsed
  assert.equal(firstNameSchema.safeParse('Mary-Jane').data, 'Mary-Jane');
  assert.equal(firstNameSchema.safeParse("O'Connor").data, "O'Connor");
  assert.equal(firstNameSchema.safeParse('  Saikiran  ').data, 'Saikiran'); // trimmed

  // Indian regional scripts
  assert.equal(firstNameSchema.safeParse('साईकिरण').data, 'साईकिरण'); // Hindi (Devanagari)
  assert.equal(firstNameSchema.safeParse('సాయికిరణ్').data, 'సాయికిరణ్'); // Telugu
  assert.equal(firstNameSchema.safeParse('கபிலன்').data, 'கபிலன்'); // Tamil
});

test('First Name: rejects empty, out of bounds, numbers, and special characters', () => {
  // Empty
  const rEmpty = firstNameSchema.safeParse('');
  assert.equal(rEmpty.success, false);
  assert.equal(rEmpty.error.issues[0].message, 'First name is required.');

  const rSpaces = firstNameSchema.safeParse('    ');
  assert.equal(rSpaces.success, false);
  assert.equal(rSpaces.error.issues[0].message, 'First name is required.');

  // Less than 2 characters
  const rShort = firstNameSchema.safeParse('S');
  assert.equal(rShort.success, false);
  assert.equal(rShort.error.issues[0].message, 'First name must contain 2–50 characters.');

  // Numbers not allowed
  const rNum = firstNameSchema.safeParse('Sai123');
  assert.equal(rNum.success, false);
  assert.equal(rNum.error.issues[0].message, 'Numbers and special characters are not allowed.');

  // Special characters not allowed
  const rSpecial = firstNameSchema.safeParse('Sai@Kiran');
  assert.equal(rSpecial.success, false);
  assert.equal(rSpecial.error.issues[0].message, 'Numbers and special characters are not allowed.');

  const rHash = firstNameSchema.safeParse('Sai#Kiran');
  assert.equal(rHash.success, false);
  assert.equal(rHash.error.issues[0].message, 'Numbers and special characters are not allowed.');
});

test('Middle Name: optional, accepts empty, validates characters if entered', () => {
  // Empty or whitespace only is allowed
  assert.equal(middleNameSchema.safeParse('').data, undefined);
  assert.equal(middleNameSchema.safeParse('   ').data, undefined);
  assert.equal(middleNameSchema.safeParse(null).data, undefined);
  assert.equal(middleNameSchema.safeParse(undefined).data, undefined);

  // Valid values
  assert.equal(middleNameSchema.safeParse('Kumar').data, 'Kumar');
  assert.equal(middleNameSchema.safeParse('Raj').data, 'Raj');
  assert.equal(middleNameSchema.safeParse('Sai Kiran').data, 'Sai Kiran');

  // Invalid numbers / special characters
  const rNum = middleNameSchema.safeParse('Kumar123');
  assert.equal(rNum.success, false);
  assert.equal(rNum.error.issues[0].message, 'Please enter a valid middle name.');

  // Over 50 chars
  const rLong = middleNameSchema.safeParse('A'.repeat(51));
  assert.equal(rLong.success, false);
  assert.equal(rLong.error.issues[0].message, 'Middle name must contain a maximum of 50 characters.');
});

test('Last Name: mandatory, 1-50 chars, approved punctuation', () => {
  // Valid
  assert.equal(lastNameSchema.safeParse('Rudra').data, 'Rudra');
  assert.equal(lastNameSchema.safeParse('Sharma').data, 'Sharma');
  assert.equal(lastNameSchema.safeParse("D'Souza").data, "D'Souza");
  assert.equal(lastNameSchema.safeParse('Smith-Jones').data, 'Smith-Jones');
  assert.equal(lastNameSchema.safeParse('S').data, 'S'); // 1 char allowed

  // Empty
  const rEmpty = lastNameSchema.safeParse('');
  assert.equal(rEmpty.success, false);
  assert.equal(rEmpty.error.issues[0].message, 'Last name is required.');

  // Invalid characters
  const rNum = lastNameSchema.safeParse('Rudra123');
  assert.equal(rNum.success, false);
  assert.equal(rNum.error.issues[0].message, 'Numbers and special characters are not allowed.');

  const rAt = lastNameSchema.safeParse('Rudra@');
  assert.equal(rAt.success, false);
  assert.equal(rAt.error.issues[0].message, 'Numbers and special characters are not allowed.');
});

test('Primary Email: mandatory, validates format, length, lowercase normalization', () => {
  // Valid examples
  assert.equal(emailSchema.safeParse('sai@gmail.com').data, 'sai@gmail.com');
  assert.equal(emailSchema.safeParse('saikiran.r@gmail.com').data, 'saikiran.r@gmail.com');
  assert.equal(emailSchema.safeParse('sai.kiran@company.co.in').data, 'sai.kiran@company.co.in');
  assert.equal(emailSchema.safeParse(' SAI@GMAIL.COM ').data, 'sai@gmail.com'); // trimmed and lowercased

  // Invalid examples
  assert.equal(emailSchema.safeParse('').success, false);
  assert.equal(emailSchema.safeParse('sai@gmail').success, false);
  assert.equal(emailSchema.safeParse('sai gmail.com').success, false);
  assert.equal(emailSchema.safeParse('sai@').success, false);
  assert.equal(emailSchema.safeParse('s@g').success, false); // < 5 chars

  // Error messages
  assert.equal(emailSchema.safeParse('').error.issues[0].message, 'Email address is required.');
  assert.equal(emailSchema.safeParse('sai@gmail').error.issues[0].message, 'Please enter a valid email address.');
  assert.equal(emailSchema.safeParse('sai gmail.com').error.issues[0].message, 'Please enter a valid email address.');
});

test('Phone Number: mandatory, exactly 10 digits starting 6-9, cleans formatting', () => {
  // Valid
  assert.equal(indianPhoneSchema.safeParse('9876543210').data, '9876543210');
  assert.equal(indianPhoneSchema.safeParse('8765432109').data, '8765432109');
  assert.equal(indianPhoneSchema.safeParse('+91 98765 43210').data, '9876543210');
  assert.equal(indianPhoneSchema.safeParse('09876543210').data, '9876543210');

  // Empty
  const rEmpty = indianPhoneSchema.safeParse('');
  assert.equal(rEmpty.success, false);
  assert.equal(rEmpty.error.issues[0].message, 'Phone number is required.');

  // Invalid length
  const rShort = indianPhoneSchema.safeParse('987654321');
  assert.equal(rShort.success, false);
  assert.equal(rShort.error.issues[0].message, 'Phone number must contain exactly 10 digits.');

  const rLong = indianPhoneSchema.safeParse('98765432101');
  assert.equal(rLong.success, false);
  assert.equal(rLong.error.issues[0].message, 'Phone number must contain exactly 10 digits.');

  // Invalid start digit
  const rFive = indianPhoneSchema.safeParse('5876543210');
  assert.equal(rFive.success, false);
  assert.equal(rFive.error.issues[0].message, 'Please enter a valid Indian mobile number.');

  // Alphabets in phone
  const rAlpha = indianPhoneSchema.safeParse('98765abc10');
  assert.equal(rAlpha.success, false);
  assert.equal(rAlpha.error.issues[0].message, 'Phone number must contain exactly 10 digits.');
});

test('Personal Step Schema: validates complete personal info object', () => {
  const validData = {
    firstName: 'Saikiran',
    middleName: 'Rao',
    lastName: 'Rudra',
    email: 'saikiran.rudra@example.com',
    phone: '+91 98765 43210',
    gender: 'Male',
    dateOfBirth: '1995-05-15',
  };

  const parsed = personalStepSchema.safeParse(validData);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.firstName, 'Saikiran');
  assert.equal(parsed.data.middleName, 'Rao');
  assert.equal(parsed.data.lastName, 'Rudra');
  assert.equal(parsed.data.email, 'saikiran.rudra@example.com');
  assert.equal(parsed.data.phone, '9876543210');
});

// -------------------------------------------------------------
// 12. Magic Byte Signature Verification
// -------------------------------------------------------------
test('Magic Byte Verification: validates authentic file headers', () => {
  // PDF (%PDF)
  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  assert.deepEqual(verifyMagicBytes(pdfHeader), { valid: true, detectedType: 'pdf' });

  // PNG (\x89PNG\r\n\x1a\n)
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepEqual(verifyMagicBytes(pngHeader), { valid: true, detectedType: 'png' });

  // JPEG (\xFF\xD8\xFF)
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  assert.deepEqual(verifyMagicBytes(jpegHeader), { valid: true, detectedType: 'jpeg' });

  // DOCX / ZIP (PK\x03\x04)
  const docxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
  assert.deepEqual(verifyMagicBytes(docxHeader), { valid: true, detectedType: 'docx' });
});

test('Magic Byte Verification: rejects spoofed files', () => {
  // Plain text pretending to be PDF
  const spoofedPdf = Buffer.from('This is actually a plain text file pretending to be pdf');
  assert.deepEqual(verifyMagicBytes(spoofedPdf), { valid: false, detectedType: 'unknown' });

  // Executable (MZ header) pretending to be JPEG
  const spoofedJpg = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
  assert.deepEqual(verifyMagicBytes(spoofedJpg), { valid: false, detectedType: 'unknown' });
});

// -------------------------------------------------------------
// 13. Masked PII Acceptance (for Edit Mode)
// -------------------------------------------------------------
test('Masked PII: schemas accept masked formats during profile edits', () => {
  // Masked PAN
  assert.equal(panSchema.safeParse('XXXXXX234F').success, true);
  assert.equal(optionalPanSchema.safeParse('XXXXXX1234').success, true);

  // Masked Aadhaar
  assert.equal(aadhaarSchema.safeParse('XXXX-XXXX-1234').success, true);
  assert.equal(optionalAadhaarSchema.safeParse('XXXXXXXX1234').success, true);

  // Masked Bank Account
  assert.equal(bankAccountSchema.safeParse('XXXXXXXX1234').success, true);
  assert.equal(optionalBankAccountSchema.safeParse('XXXX1234').success, true);
});

// -------------------------------------------------------------
// 14. Govt ID Type & Dynamic Personal ID Validation Tests
// -------------------------------------------------------------
test('Govt ID Type: validatePersonalIdByGovtId for Aadhaar Card', () => {
  const checksum = generateVerhoeff('23456789012');
  const validAadhaar = `23456789012${checksum}`;

  // Valid
  assert.equal(validatePersonalIdByGovtId(validAadhaar, 'Aadhaar Card'), null);
  assert.equal(validatePersonalIdByGovtId(`  ${validAadhaar}  `, 'Aadhaar Card'), null);
  assert.equal(validatePersonalIdByGovtId('XXXX-XXXX-1234', 'Aadhaar Card'), null); // Masked
  assert.equal(validatePersonalIdByGovtId('XXXXXXXX1234', 'Aadhaar Card'), null); // Masked

  // Empty is valid (field is optional)
  assert.equal(validatePersonalIdByGovtId('', 'Aadhaar Card'), null);
  assert.equal(validatePersonalIdByGovtId(null, 'Aadhaar Card'), null);
  assert.equal(validatePersonalIdByGovtId(undefined, 'Aadhaar Card'), null);

  // Invalid checksum
  const badChecksum = `23456789012${(checksum + 1) % 10}`;
  assert.equal(validatePersonalIdByGovtId(badChecksum, 'Aadhaar Card'), 'Invalid Aadhaar number (Verhoeff checksum failed)');

  // Invalid starting digit (starts with 0 or 1)
  assert.equal(validatePersonalIdByGovtId('012345678901', 'Aadhaar Card'), 'Aadhaar must be a 12-digit number and cannot start with 0 or 1');
  assert.equal(validatePersonalIdByGovtId('123456789012', 'Aadhaar Card'), 'Aadhaar must be a 12-digit number and cannot start with 0 or 1');

  // Invalid length
  assert.equal(validatePersonalIdByGovtId('2345678901', 'Aadhaar Card'), 'Aadhaar must be a 12-digit number and cannot start with 0 or 1');
});

test('Govt ID Type: validatePersonalIdByGovtId for PAN Card', () => {
  // Valid
  assert.equal(validatePersonalIdByGovtId('ABCDE1234F', 'PAN Card'), null);
  assert.equal(validatePersonalIdByGovtId('abcde1234f', 'PAN Card'), null); // Case-insensitive
  assert.equal(validatePersonalIdByGovtId('XXXXXX1234', 'PAN Card'), null); // Masked

  // Empty is valid
  assert.equal(validatePersonalIdByGovtId('', 'PAN Card'), null);
  assert.equal(validatePersonalIdByGovtId(null, 'PAN Card'), null);

  // Invalid
  assert.match(
    validatePersonalIdByGovtId('ABCDE12345', 'PAN Card') || '',
    /Invalid PAN format/
  );
  assert.match(
    validatePersonalIdByGovtId('12345ABCDE', 'PAN Card') || '',
    /Invalid PAN format/
  );
});

test('Govt ID Type: validatePersonalIdByGovtId for Social Security Number', () => {
  // Valid
  assert.equal(validatePersonalIdByGovtId('123-45-6789', 'Social Security Number'), null);
  assert.equal(validatePersonalIdByGovtId('123456789', 'Social Security Number'), null);
  assert.equal(validatePersonalIdByGovtId('XXX-XX-1234', 'Social Security Number'), null); // Masked
  assert.equal(validatePersonalIdByGovtId('XXXXX1234', 'Social Security Number'), null); // Masked

  // Empty is valid
  assert.equal(validatePersonalIdByGovtId('', 'Social Security Number'), null);

  // Invalid Area (000, 666, 9xx)
  assert.equal(validatePersonalIdByGovtId('000-45-6789', 'Social Security Number'), 'Invalid SSN area number');
  assert.equal(validatePersonalIdByGovtId('666-45-6789', 'Social Security Number'), 'Invalid SSN area number');
  assert.equal(validatePersonalIdByGovtId('900-45-6789', 'Social Security Number'), 'Invalid SSN area number');

  // Invalid Group (00)
  assert.equal(validatePersonalIdByGovtId('123-00-6789', 'Social Security Number'), 'Invalid SSN group number');

  // Invalid Serial (0000)
  assert.equal(validatePersonalIdByGovtId('123-45-0000', 'Social Security Number'), 'Invalid SSN serial number');

  // Invalid length
  assert.match(
    validatePersonalIdByGovtId('123-45-678', 'Social Security Number') || '',
    /Invalid Social Security Number/
  );
});

test('Govt ID Type: validatePersonalIdByGovtId for Passport', () => {
  // Valid Indian passport (1 letter + 7 digits)
  assert.equal(validatePersonalIdByGovtId('A1234567', 'Passport'), null);
  assert.equal(validatePersonalIdByGovtId('z9876543', 'Passport'), null);

  // Valid General / International passport (6 to 12 alphanumeric)
  assert.equal(validatePersonalIdByGovtId('L898902C3', 'Passport'), null);
  assert.equal(validatePersonalIdByGovtId('AB123456CD', 'Passport'), null);

  // Empty is valid
  assert.equal(validatePersonalIdByGovtId('', 'Passport'), null);

  // Invalid
  assert.match(
    validatePersonalIdByGovtId('A12', 'Passport') || '',
    /Invalid Passport number/
  );
  assert.match(
    validatePersonalIdByGovtId('A12345678901234', 'Passport') || '',
    /Invalid Passport number/
  );
});

test('Govt ID Type: validatePersonalIdByGovtId for Driver License', () => {
  // Valid Indian DL format
  assert.equal(validatePersonalIdByGovtId('MH0220110012345', 'Driver License'), null);
  assert.equal(validatePersonalIdByGovtId('DL-1420110012345', 'Driver License'), null);

  // Valid General DL format (8-20 alphanumeric)
  assert.equal(validatePersonalIdByGovtId('D12345678', 'Driver License'), null);

  // Empty is valid
  assert.equal(validatePersonalIdByGovtId('', 'Driver License'), null);

  // Invalid
  assert.match(
    validatePersonalIdByGovtId('MH02', 'Driver License') || '',
    /Invalid Driver License number/
  );
});

test('Govt ID Type: validatePersonalIdByGovtId for Other', () => {
  // Valid 3-50 chars alphanumeric + basic punctuation
  assert.equal(validatePersonalIdByGovtId('EMP-ID-9923', 'Other'), null);
  assert.equal(validatePersonalIdByGovtId('GOV/2026/881', 'Other'), null);

  // Empty is valid
  assert.equal(validatePersonalIdByGovtId('', 'Other'), null);

  // Too short (< 3)
  assert.equal(validatePersonalIdByGovtId('AB', 'Other'), 'Personal ID must be between 3 and 50 characters');

  // Invalid special chars
  assert.equal(validatePersonalIdByGovtId('EMP$#@', 'Other'), 'Personal ID can only contain letters, numbers, spaces, hyphens, and slashes');
});

test('Govt ID Type: getGovtIdPlaceholder returns informative placeholders', () => {
  assert.match(getGovtIdPlaceholder('Aadhaar Card'), /12 digits/);
  assert.match(getGovtIdPlaceholder('PAN Card'), /ABCDE1234F/);
  assert.match(getGovtIdPlaceholder('Social Security Number'), /123-45-6789/);
  assert.match(getGovtIdPlaceholder('Passport'), /A1234567/);
  assert.match(getGovtIdPlaceholder('Driver License'), /MH0220110012345/);
  assert.equal(getGovtIdPlaceholder('Other'), 'Enter identification number');
});

test('Personal Step Schema: dynamically validates personalIdNumber against govtIdType', () => {
  const baseData = {
    firstName: 'Saikiran',
    lastName: 'Rudra',
    email: 'saikiran.rudra@example.com',
    phone: '9876543210',
  };

  // Valid Aadhaar
  const checksum = generateVerhoeff('23456789012');
  const validAadhaar = `23456789012${checksum}`;
  const rValidAadhaar = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'Aadhaar Card',
    personalIdNumber: validAadhaar,
  });
  assert.equal(rValidAadhaar.success, true);

  // Invalid Aadhaar fails and sets error path to personalIdNumber
  const rInvalidAadhaar = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'Aadhaar Card',
    personalIdNumber: '123456789012',
  });
  assert.equal(rInvalidAadhaar.success, false);
  assert.equal(rInvalidAadhaar.error.issues[0].path[0], 'personalIdNumber');

  // Valid PAN
  const rValidPan = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'PAN Card',
    personalIdNumber: 'ABCDE1234F',
  });
  assert.equal(rValidPan.success, true);

  // Invalid PAN fails
  const rInvalidPan = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'PAN Card',
    personalIdNumber: 'INVALID_PAN',
  });
  assert.equal(rInvalidPan.success, false);
  assert.equal(rInvalidPan.error.issues[0].path[0], 'personalIdNumber');

  // Valid SSN
  const rValidSsn = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'Social Security Number',
    personalIdNumber: '123-45-6789',
  });
  assert.equal(rValidSsn.success, true);

  // Invalid SSN fails
  const rInvalidSsn = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'Social Security Number',
    personalIdNumber: '000-45-6789',
  });
  assert.equal(rInvalidSsn.success, false);
  assert.equal(rInvalidSsn.error.issues[0].path[0], 'personalIdNumber');

  // Valid Passport
  const rValidPassport = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'Passport',
    personalIdNumber: 'A1234567',
  });
  assert.equal(rValidPassport.success, true);

  // Valid Driver License
  const rValidDl = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'Driver License',
    personalIdNumber: 'MH0220110012345',
  });
  assert.equal(rValidDl.success, true);

  // Empty personalIdNumber is valid (optional)
  const rEmptyId = personalStepSchema.safeParse({
    ...baseData,
    govtIdType: 'PAN Card',
    personalIdNumber: '',
  });
  assert.equal(rEmptyId.success, true);
});
