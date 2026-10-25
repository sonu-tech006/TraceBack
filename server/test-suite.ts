import { db, User, Item } from './db.js';
import { calculateMatchScore, computeMatches } from './matching.js';
import { analyzeItemDescription } from './ai.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- TraceBack Automated Verification Suite ---');

  // Test 1: Seed Data Verification
  console.log('\n[1] Seed Benchmark Integrity');
  const items = db.getItems();
  assert(items.length >= 100, `Database contains at least 100 benchmark items (found: ${items.length})`);
  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;
  assert(lostCount >= 50, `At least 50 Lost reports exist (found: ${lostCount})`);
  assert(foundCount >= 50, `At least 50 Found reports exist (found: ${foundCount})`);

  // Test 2: User Authentication & Role System
  console.log('\n[2] User Registration & Password Hashing');
  const testEmail = `tester-${Date.now()}@campus.edu`;
  const passwordHash = db.hashPassword('testSecretPass123');
  const newUser: User = {
    id: `usr-test-${Date.now()}`,
    name: 'Test Student',
    email: testEmail,
    passwordHash,
    role: 'user',
    organization: 'Computer Science Dept',
    createdAt: new Date().toISOString(),
  };
  db.addUser(newUser);

  const retrieved = db.findUserByEmail(testEmail);
  assert(retrieved !== undefined, 'User registered and retrievable by email');
  assert(retrieved?.passwordHash === passwordHash, 'Password hashing securely stored');
  assert(retrieved?.role === 'user', 'Role assigned correctly');

  // Test 3: Privacy of Hidden Verification Clues
  console.log('\n[3] Privacy & Ownership Clues Protection');
  const sampleFound = items.find((i) => i.type === 'found' && i.privateClues?.secretMarks);
  assert(sampleFound !== undefined, 'Found item with private verification clues exists');
  assert(typeof sampleFound?.privateClues?.secretMarks === 'string', 'Secret marks stored privately in database model');
  assert((sampleFound?.privateClues?.secretMarks?.length || 0) > 0, 'Private verification clue is non-empty');

  // Test 4: Algorithmic Matching Engine & Scoring Signals
  console.log('\n[4] Matching Engine & Multi-Signal Scoring');
  const lostMac = items.find((i) => i.id === 'lost-demo-01');
  const foundMac = items.find((i) => i.id === 'found-demo-01');
  assert(lostMac !== undefined && foundMac !== undefined, 'Direct paired benchmark items located');

  if (lostMac && foundMac) {
    const match = calculateMatchScore(lostMac, foundMac);
    assert(match.score >= 80, `Compatible pairing scored high confidence: ${match.score}% (expected >= 80%)`);
    assert(match.breakdown.categoryScore > 0, 'Category signal contributed to score');
    assert(match.breakdown.brandScore > 0, 'Brand signal contributed to score');
    assert(match.breakdown.colorScore > 0, 'Color signal contributed to score');
    assert(match.breakdown.locationScore > 0, 'Location signal contributed to score');
    assert(match.matchingAttributes.length > 0, 'Matching attributes generated');
  }

  // Incompatible pairing test
  const lostKey = items.find((i) => i.category === 'Keys & Badges');
  if (lostMac && lostKey) {
    const mismatch = calculateMatchScore(lostMac, lostKey);
    assert(mismatch.score < 50, `Incompatible categories scored low: ${mismatch.score}% (expected < 50%)`);
  }

  // Test 5: End-to-End User Journey Simulation
  console.log('\n[5] End-to-End Workflow: Report -> Match -> Claim -> Review -> Return');
  
  // Step 5.1: Create Lost Report
  const now = new Date().toISOString();
  const createdLost: Item = {
    id: `lost-e2e-${Date.now()}`,
    type: 'lost',
    title: 'Navy Herschel Laptop Backpack',
    category: 'Bags & Luggage',
    subcategory: 'Backpacks',
    description: 'Left in Student Union lounge near fireplace.',
    date: now.split('T')[0],
    location: 'Student Union Lounge',
    city: 'Cambridge',
    color: 'Navy Blue',
    brand: 'Herschel Supply Co.',
    distinguishingFeatures: ['Small bronze zipper pin', 'Initials T.S. inside tag'],
    contactMethod: 'In-app claim',
    images: [{ url: '', isIllustrative: false }],
    sensitiveData: false,
    status: 'open',
    userId: newUser.id,
    userName: newUser.name,
    userEmail: newUser.email,
    isDemo: false,
    privateClues: {
      secretMarks: 'Initials T.S. stamped inside tag',
      verificationQuestion: 'What initials are written on the inside seam?',
    },
    createdAt: now,
    updatedAt: now,
  };
  db.addItem(createdLost);
  assert(db.findItemById(createdLost.id) !== undefined, 'Lost report successfully persisted');

  // Step 5.2: Create Matching Found Item
  const createdFound: Item = {
    id: `found-e2e-${Date.now()}`,
    type: 'found',
    title: 'Found Navy Blue Herschel Rucksack',
    category: 'Bags & Luggage',
    subcategory: 'Backpacks',
    description: 'Found unattended in Union lounge area.',
    date: now.split('T')[0],
    location: 'Student Union Lounge',
    city: 'Cambridge',
    color: 'Navy Blue',
    brand: 'Herschel Supply Co.',
    distinguishingFeatures: ['Bronze zipper pin'],
    contactMethod: 'Custody Desk',
    images: [{ url: '', isIllustrative: false }],
    sensitiveData: false,
    status: 'open',
    userId: 'usr-admin-1',
    userName: 'Marcus Vance',
    userEmail: 'marcus.admin@traceback.org',
    isDemo: false,
    privateClues: {
      secretMarks: 'Initials T.S. stamped inside tag',
      exactStorageLocation: 'Union Information Desk Locker 12',
      verificationQuestion: 'What initials are written on the inside seam?',
    },
    createdAt: now,
    updatedAt: now,
  };
  db.addItem(createdFound);

  // Step 5.3: Match calculation
  const e2eMatch = calculateMatchScore(createdLost, createdFound);
  assert(e2eMatch.score >= 75, `Automated pairing recognized with score ${e2eMatch.score}%`);

  // Step 5.4: Submit Ownership Claim
  const claimId = `claim-e2e-${Date.now()}`;
  db.addClaim({
    id: claimId,
    foundItemId: createdFound.id,
    foundItemTitle: createdFound.title,
    lostItemId: createdLost.id,
    claimantUserId: newUser.id,
    claimantName: newUser.name,
    claimantEmail: newUser.email,
    reporterUserId: createdFound.userId,
    status: 'pending',
    answers: [{ question: 'What initials are written on the inside seam?', answer: 'T.S.' }],
    privateProofDescription: 'Receipt from Herschel store with purchase date September 2025.',
    handoverDetails: {
      safeLocation: 'Student Union Desk',
      verificationCode: 'TB-9912',
      reporterConfirmed: false,
      claimantConfirmed: false,
    },
    timeline: [{ action: 'Claim Submitted', timestamp: now, by: newUser.name }],
    createdAt: now,
    updatedAt: now,
  });
  const savedClaim = db.findClaimById(claimId);
  assert(savedClaim !== undefined, 'Ownership claim submitted and persisted');
  assert(savedClaim?.status === 'pending', 'Claim initial status is pending');

  // Step 5.5: Staff Review & Approval
  db.updateClaim(claimId, {
    status: 'approved',
    reviewNotes: 'Initials match physical inspection inside bag tag.',
  });
  const approvedClaim = db.findClaimById(claimId);
  assert(approvedClaim?.status === 'approved', 'Claim approved by staff');

  // Step 5.6: Safe Two-Party Handover Confirmation
  db.updateClaim(claimId, {
    status: 'completed',
    handoverDetails: {
      safeLocation: 'Student Union Desk',
      verificationCode: 'TB-9912',
      reporterConfirmed: true,
      claimantConfirmed: true,
    },
  });
  db.updateItem(createdFound.id, { status: 'returned' });
  db.updateItem(createdLost.id, { status: 'recovered' });

  const completedClaim = db.findClaimById(claimId);
  assert(completedClaim?.status === 'completed', 'Two-party handover confirmed');
  assert(db.findItemById(createdFound.id)?.status === 'returned', 'Found item status marked returned');
  assert(db.findItemById(createdLost.id)?.status === 'recovered', 'Lost item status marked recovered');

  // Test 6: AI Attribute Extraction Fallback Resilience
  console.log('\n[6] AI Description Analyzer Resilience');
  const extracted = await analyzeItemDescription('I forgot my silver MacBook Air M2 near the campus library 2nd floor printer yesterday');
  assert(extracted.category === 'Electronics', `Extracted category is Electronics (got: ${extracted.category})`);
  assert(extracted.brand === 'Apple', `Extracted brand is Apple (got: ${extracted.brand})`);
  assert(extracted.color.toLowerCase().includes('silver'), `Extracted color is Silver (got: ${extracted.color})`);
  assert(extracted.suggestedVerificationQuestions.length >= 1, 'Generated verification questions for owner');

  // Summary
  console.log(`\n========================================`);
  console.log(`Test Execution Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
