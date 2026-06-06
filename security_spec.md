# Security Specification and Threat Model (ABAC Policy)

## 1. Data Invariants
- **Log Integrity**: A `MoodLog` must have a valid score between 0 and 5. It cannot contain custom scripts or unexpected fields (prevent "Value Poisoning").
- **Chat Authenticity**: A `ChatMessage` must have a sender that is either `user` or `ai`. No unauthorized roles or status updates can be injected.
- **Id Poisoning Prevention**: All document IDs must conform to `isValidId()` limits (alphanumeric, max length of 128 characters).
- **Temporal Alignment**: Create/Write events must lock `createdAt` and `timestamp` fields strictly using actual `request.time`.

---

## 2. The "Dirty Dozen" Threat Payloads
Here are 12 malicious payloads aiming to compromise identity, state or structure:

1. **Self-Assigned Admin**: Attempting to flag oneself as a system administrator during a simple database write.
2. **Score Poisoning**: Writing a mood log with a score of `99.9` (out of bounds).
3. **Ghost Fields Injection**: Injecting a custom unauthorized parameter `isAuthorizedServerOverride: true` in a mood log.
4. **Id Poisoning Attack**: Attempting to write a log targeting a 1MB-sized document ID to trigger Wallet Exhaustion.
5. **Sender Impersonation**: Forging the sender name to something other than `user` or `ai` (e.g., `system_root` or `doctor`).
6. **Time Spoofing (Future/Past)**: Spoofing the timestamp of a chat message to a future date instead of using the server clock.
7. **Cross-User Snooping**: Reading other people's chats without passing an owner validation check.
8. **Malicious Script Payload**: Injecting dynamic `<script>` text inside a message to bypass raw sanitization.
9. **Null Score Bypass**: Omitting required validation fields like `isCameraDetected`.
10. **State Skipping**: Manually setting or overriding system-generated therapeutic advice tips without system generation.
11. **Anonymized Write Spoofing**: Attempting to write data without an initialized socket identity.
12. **Mass List Scraper**: Attempting to pull the entire collection of chats across all guest sessions.

---

## 3. Test Runner Specification (`firestore.rules.test.ts`)
To mock these behaviors and verify that they fail under the ruleset:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('MediSense Security Policy Enforcement', () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'placeholder-project-id',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} { allow read, write: if false; }
            }
          }
        `
      }
    });
  });

  it('rejects self-assigned admin writes', async () => {
    const context = testEnv.authenticatedContext('guest-user');
    const db = context.firestore();
    await assertFails(db.collection('mood_logs').add({
      emotion: 'Happy',
      score: 5,
      isAdmin: true,
      timestamp: new Date().toISOString()
    }));
  });

  it('rejects out-of-range mood scores', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(db.collection('mood_logs').add({
      emotion: 'Exhausted',
      score: 99.9,
      isCameraDetected: false,
      timestamp: new Date().toISOString()
    }));
  });
});
```
