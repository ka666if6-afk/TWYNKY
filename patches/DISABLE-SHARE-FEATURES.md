# Disable Share Features Patch

This patch temporarily disables all "Share" functionality in Element Web to prevent users from sharing rooms, users, messages, and call links via social networks or direct links.

## Files Modified

### 1. `/src/components/views/rooms/RoomHeader/CallGuestLinkButton.tsx`
- **Commented out:** `ShareDialog` import
- **Commented out:** `Modal.createDialog(ShareDialog, ...)` call in `showLinkModal()`
- **Commented out:** Entire share button component in return statement

**Impact:** Users can no longer share call links via the "Share call link" button in room headers.

---

### 2. `/src/components/viewmodels/right_panel/RoomSummaryCardViewModel.tsx`
- **Commented out:** `ShareDialog` import
- **Commented out:** `onShareRoomClick()` function implementation
- **Commented out:** `onShareRoomClick` in interface definition
- **Commented out:** `onShareRoomClick` in returned state object

**Impact:** Share room button removed from room info panel in right sidebar.

---

### 3. `/src/components/viewmodels/right_panel/user_info/UserInfoBasicOptionsViewModel.tsx`
- **Commented out:** `ShareDialog` import
- **Commented out:** `onShareUserClick()` function implementation
- **Commented out:** `onShareUserClick` in interface definition
- **Commented out:** `onShareUserClick` in returned state object

**Impact:** Share user button removed from user info panel in right sidebar.

---

### 4. `/src/components/views/context_menus/MessageContextMenu.tsx`
- **Commented out:** `ShareDialog` import
- **Commented out:** `onShareClick()` method
- **Commented out:** Entire `permalinkButton` component rendering
- **Commented out:** `{permalinkButton}` in menu items list

**Impact:** "Share" option removed from message context menu (right-click on messages).

---

## What Still Works

✅ All other functionality remains intact:
- Message sending
- Message editing/deletion
- Pinning/unpinning messages
- Reacting to messages
- Forwarding messages (without Share dialog)
- All other message actions

## Reverting the Patch

To re-enable Share features, uncomment the marked sections in these four files:
1. Search for `// import { ShareDialog`
2. Search for `// const onShareRoomClick`
3. Search for `// const onShareUserClick`
4. Search for `// private onShareClick`
5. Search for `/* let permalinkButton`

Or simply restore the original files from git.

---

## Verification

After applying this patch, ensure:
✓ No "Share" button in room info panel
✓ No "Share call link" button in room header
✓ No "Share" option in user info panel
✓ No "Share" option in message context menu
✓ All other UI and functionality works normally

---

## Compilation Status

All files compile without errors after patch application:
- ✅ CallGuestLinkButton.tsx - No errors
- ✅ RoomSummaryCardViewModel.tsx - No errors
- ✅ UserInfoBasicOptionsViewModel.tsx - No errors
- ✅ MessageContextMenu.tsx - No errors

---

**Date Applied:** 2025-11-19
**Reason:** Temporary disabling of share functionality for security/customization purposes
