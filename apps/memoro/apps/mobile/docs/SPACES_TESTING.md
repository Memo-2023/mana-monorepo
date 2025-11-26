# Memoro Spaces Testing Guide

This guide outlines the steps to test the spaces functionality in the Memoro app.

## Test Environment Setup

Before testing, ensure you have:
- A development build of the Memoro app running
- At least one test user account
- A few test memos created

You can enable mock data for testing without a backend by setting the environment variable:
```
EXPO_PUBLIC_USE_MOCK_DATA=true
```

## Testing Areas

### 1. Spaces List View

#### Create a New Space
- Navigate to the Spaces tab
- Tap "Create New Space" button
- Enter a space name (e.g., "Test Space")
- Tap "Create"
- **Expected**: A new space should appear in the list

#### Space List Display
- Check that the spaces list shows:
  - Space name
  - Description (if any)
  - Color indicator
  - Memo count
- **Expected**: All spaces should be listed with correct information

#### Delete a Space
- Long press or tap on a space to open the action menu
- Select "Delete" from the menu
- Confirm deletion in the alert dialog
- **Expected**: 
  - A confirmation dialog should show the space name
  - After confirmation, the space should be removed from the list
  - Success message should appear

### 2. Space Detail View

#### Navigate to Space Detail
- Tap on a space in the spaces list
- Select "View Details" from the menu
- **Expected**: Space detail screen should open showing space information

#### Space Information Display
- Check that the space detail view shows:
  - Space name
  - Description
  - Color indicator
  - Memo count
- **Expected**: All information should be displayed correctly

#### View Memos in a Space
- Scroll down to see the "Memos in this Space" section
- **Expected**: All memos associated with the space should be listed
- **Expected**: If no memos are associated, an appropriate message should be shown

#### Add New Memo to Space
- Tap "Create New Memo" button
- **Expected**: Navigation to memo creation screen
- **Note**: This may not be fully implemented yet

### 3. Memo-Space Management

#### Link a Memo to Spaces
- Navigate to a memo detail view
- Tap the menu (three dots) icon
- Select "Manage Spaces" from the menu
- Check/uncheck spaces to link/unlink the memo
- Tap "Save"
- **Expected**: 
  - Space selector modal should open showing all available spaces
  - Spaces should be checkable/uncheckable
  - After saving, changes should persist

#### Unlink a Memo from Spaces
- Navigate to a memo detail view
- Tap the menu icon
- Select "Manage Spaces"
- Uncheck a currently checked space
- Tap "Save"
- **Expected**: The memo should no longer be associated with the unchecked space

#### Verify Space-Memo Relationships
- Link a memo to a space
- Navigate to that space's detail view
- **Expected**: The linked memo should appear in the space's memo list
- Unlink the memo from the space
- **Expected**: The memo should no longer appear in the space's memo list

### 4. Error Handling

#### Network Errors
- Turn off internet connection
- Attempt to create a space or link a memo to a space
- **Expected**: Appropriate error message should be displayed
- **Expected**: The app should not crash

#### Invalid Operations
- Try to delete a space that has memos (if that's restricted)
- **Expected**: Appropriate warning or confirmation message

#### Recovery from Errors
- Cause an error (e.g., by network disconnect)
- Restore connectivity
- Retry the operation
- **Expected**: Operation should succeed after retry

## Edge Cases

### Space with Many Memos
- Create a space
- Link 10+ memos to it
- View the space detail
- **Expected**: All memos should load and display correctly

### Long Names and Descriptions
- Create a space with a very long name (>50 characters)
- Add a long description (>200 characters)
- View in both list and detail views
- **Expected**: Text should be properly truncated or wrapped

### Empty States
- Delete all spaces
- Check spaces list
- **Expected**: An appropriate "no spaces" message should be displayed
- Create a space with no memos
- View space detail
- **Expected**: An appropriate "no memos" message should be displayed

## Known Limitations

- Mock data mode does not fully simulate the linking/unlinking behavior
- Some UI elements may not be fully responsive on all device sizes
- Space deletion might not properly handle linked memos in some edge cases

## Reporting Issues

If you encounter any issues during testing, please document:
1. The steps to reproduce the issue
2. What you expected to happen
3. What actually happened
4. Any error messages displayed
5. Screenshots if applicable

Report these issues to the development team via the project management system.