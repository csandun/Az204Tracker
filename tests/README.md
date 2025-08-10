# Playwright Testing for Guest Reply Functionality

## Setup

1. **Install Playwright** (if not already installed):
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

2. **Ensure your development server is running**:
   ```bash
   npm run dev
   ```
   The app should be running on `http://localhost:3001`

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests with browser visible (headed mode):
```bash
npm run test:headed
```

### Run tests with UI mode (interactive):
```bash
npm run test:ui
```

### Run tests in debug mode:
```bash
npm run test:debug
```

### Run specific test files:
```bash
npx playwright test guest-reply.spec.ts
npx playwright test authentication-features.spec.ts
npx playwright test complete-guest-workflow.spec.ts
```

## Test Coverage

### 1. Guest Reply Tests (`guest-reply.spec.ts`)
- ✅ Reply button visibility for non-authenticated users
- ✅ Add Note button hidden for guests
- ✅ Edit/Delete buttons hidden for guests
- ✅ Reply modal opens with guest name field
- ✅ Guest name validation
- ✅ Successful guest reply submission
- ✅ Guest name display with "(guest)" label
- ✅ Prevention of top-level note creation by guests
- ✅ Visibility of all notes and resources

### 2. Authentication Features (`authentication-features.spec.ts`)
- ✅ Read-only interface for non-authenticated users
- ✅ Reply buttons visible to all users
- ✅ Guest name field in reply modal
- ✅ Form validation for guest name and reply text
- ✅ Proper formatting of guest replies
- ✅ UI security (hiding administrative functions)

### 3. Complete Workflow (`complete-guest-workflow.spec.ts`)
- ✅ End-to-end guest reply workflow
- ✅ Guest cannot edit/delete their own replies
- ✅ Proper nesting of guest replies
- ✅ Multiple guests can reply to same note

## Test Scenarios

### Prerequisites for Testing
The tests expect:
1. At least one module exists in the database
2. At least one section exists in the first module
3. At least one note exists in the first section (for reply testing)

### Database Migration Required
Before running tests, ensure you've applied the guest reply migration:

```sql
-- Add guest_name column and update policies
ALTER TABLE public.short_notes ADD COLUMN guest_name text;
ALTER TABLE public.short_notes ALTER COLUMN user_id DROP NOT NULL;

-- Update policies to allow guest replies
DROP POLICY IF EXISTS "insert own short_notes" ON public.short_notes;
CREATE POLICY "insert own short_notes or guest replies" ON public.short_notes 
  FOR INSERT 
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR 
    (auth.uid() IS NULL AND user_id IS NULL AND parent_id IS NOT NULL AND guest_name IS NOT NULL AND length(trim(guest_name)) > 0)
  );
```

## Test Results

The tests verify:
- **Security**: Guests can only reply, not create/edit/delete
- **Functionality**: Guest replies work with proper validation
- **UI/UX**: Appropriate elements shown/hidden based on auth status
- **Data**: Guest names and replies are properly stored and displayed

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Tests expect app on port 3001
2. **No existing notes**: Some tests require existing notes to test replies
3. **Database policies**: Ensure migration is applied for guest functionality
4. **Browser installation**: Run `npx playwright install` if browsers are missing

### Debug Tips:

1. Use `--headed` to see tests running in browser
2. Use `--debug` to step through tests
3. Check browser console for JavaScript errors
4. Verify database has test data (modules, sections, notes)

## Expected Behavior

### For Non-Authenticated Users:
- ✅ Can view all notes and resources
- ✅ Can reply to existing notes (with name required)
- ❌ Cannot create top-level notes
- ❌ Cannot edit or delete any notes
- ❌ Cannot add resources
- ❌ Cannot see progress tracking

### For Guest Replies:
- ✅ Display with "(guest)" label
- ✅ Show user icon
- ✅ Include timestamp
- ✅ Support threading/nesting
- ✅ Require guest name validation
