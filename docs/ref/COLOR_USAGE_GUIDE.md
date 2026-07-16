# How to Use the New Color Palette 🎨

Your `theme.js` now has the 3-color system ready to use!

---

## 📦 The COLORS Object

All colors are defined in `theme.js` and exported:

```javascript
const COLORS = {
  primary: '#0E7C88',      // Teal - main brand
  accent: '#E8563D',       // Coral - secondary
  text: '#374151',         // Dark gray - text
  success: '#10B981',      // Green - success
  warning: '#FBBF24',      // Amber - warning
  error: '#EF4444',        // Red - error
  bgPrimary: '#FFFFFF',    // White background
  bgSecondary: '#FAFAFA',  // Off-white background
  textMuted: '#9CA3AF',    // Light gray text
  border: '#E5E7EB',       // Border color
}
```

---

## ✅ How to Use in Components

### 1. **Import COLORS**

```javascript
import { COLORS } from '../theme'
```

### 2. **Use in MUI Components**

#### Buttons
```javascript
// Primary button (Create, Save, Submit)
<Button
  variant="contained"
  sx={{ bgcolor: COLORS.primary }}
>
  Create Bill
</Button>

// Secondary button (Cancel, Delete)
<Button
  variant="contained"
  sx={{ bgcolor: COLORS.accent }}
>
  Cancel
</Button>

// Success button (Mark as Paid)
<Button
  variant="contained"
  sx={{ bgcolor: COLORS.success }}
>
  Mark as Paid
</Button>
```

#### Text & Typography
```javascript
// Main heading
<Typography
  variant="h5"
  sx={{ color: COLORS.text, fontWeight: 600 }}
>
  Dashboard
</Typography>

// Body text
<Typography sx={{ color: COLORS.text }}>
  Description text
</Typography>

// Helper/muted text
<Typography sx={{ color: COLORS.textMuted }}>
  Helper text
</Typography>
```

#### Boxes & Containers
```javascript
// Main content area
<Box sx={{ bgcolor: COLORS.bgPrimary }}>
  Content
</Box>

// Card or section
<Box sx={{
  bgcolor: COLORS.bgSecondary,
  padding: 2,
  borderRadius: 1
}}>
  Card content
</Box>

// With border
<Box sx={{
  bgcolor: COLORS.bgPrimary,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 1
}}>
  Content with border
</Box>
```

#### Status Alerts
```javascript
// Success message
<Alert
  severity="success"
  sx={{ bgcolor: COLORS.success, color: 'white' }}
>
  Payment successful!
</Alert>

// Warning message
<Alert
  severity="warning"
  sx={{ bgcolor: COLORS.warning, color: '#000' }}
>
  Payment pending
</Alert>

// Error message
<Alert
  severity="error"
  sx={{ bgcolor: COLORS.error, color: 'white' }}
>
  Payment failed!
</Alert>
```

---

## 🔄 Replacing Old Colors in Components

### Example: Debt Page

**OLD (using hardcoded colors):**
```javascript
const COLORS = {
  iOwe: {
    bg: '#fce4ec',
    text: '#574D98',
  },
  owedToMe: {
    bg: '#5e4fa2',
    text: '#FECDD2',
  }
};
```

**NEW (using theme colors):**
```javascript
import { COLORS } from '../../theme'

// "I Owe" section header
<Box sx={{
  bgcolor: COLORS.primary,
  color: '#fff',
  padding: 2
}}>
  I Owe
</Box>

// "Owed to Me" section header
<Box sx={{
  bgcolor: COLORS.accent,
  color: '#fff',
  padding: 2
}}>
  Owed to Me
</Box>

// All text in both sections
<Typography sx={{ color: COLORS.text }}>
  John Smith
</Typography>
```

---

## 📝 File Locations to Update

### Priority 1 - Update These First:
- [ ] `web/src/pages/Debt/Debt.jsx` - Replace COLORS constants
- [ ] `web/src/components/Layout/Layout.jsx` - Sidebar colors
- [ ] `web/src/components/AppBar/` - AppBar colors
- [ ] `web/src/pages/Auth/LoginForm.jsx` - Auth form buttons
- [ ] `web/src/pages/Dashboard/Dashboard.jsx` - Activity badges

### Priority 2 - Update These Second:
- [ ] `web/src/components/` - All other components using colors
- [ ] `web/src/pages/` - Any pages with custom colors

---

## ✨ Before/After Examples

### Example 1: Create Button

**BEFORE:**
```javascript
<Button sx={{
  bgcolor: '#574D98',  // Old purple
  color: 'white'
}}>
  Create Bill
</Button>
```

**AFTER:**
```javascript
import { COLORS } from '../theme'

<Button sx={{
  bgcolor: COLORS.primary,  // New teal
  color: 'white'
}}>
  Create Bill
</Button>
```

---

### Example 2: Section Header

**BEFORE:**
```javascript
<Box sx={{
  bgcolor: '#fce4ec',  // Old pink
  padding: 2
}}>
  <Typography sx={{ color: '#574D98' }}>I Owe</Typography>
</Box>
```

**AFTER:**
```javascript
import { COLORS } from '../theme'

<Box sx={{
  bgcolor: COLORS.primary,
  padding: 2
}}>
  <Typography sx={{ color: '#fff' }}>I Owe</Typography>
</Box>
```

---

### Example 3: Status Badge

**BEFORE:**
```javascript
<Box sx={{
  bgcolor: status === 'paid' ? '#10b981' : '#fbbf24',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px'
}}>
  {status}
</Box>
```

**AFTER:**
```javascript
import { COLORS } from '../theme'

<Box sx={{
  bgcolor: status === 'paid' ? COLORS.success : COLORS.warning,
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px'
}}>
  {status}
</Box>
```

---

## 🎯 Quick Reference Cheat Sheet

| Use | Color Variable | Hex Code |
|-----|---|---|
| Primary button | `COLORS.primary` | `#0E7C88` |
| Secondary button | `COLORS.accent` | `#E8563D` |
| Main text | `COLORS.text` | `#374151` |
| Muted text | `COLORS.textMuted` | `#9CA3AF` |
| Success status | `COLORS.success` | `#10B981` |
| Warning status | `COLORS.warning` | `#FBBF24` |
| Error status | `COLORS.error` | `#EF4444` |
| Main background | `COLORS.bgPrimary` | `#FFFFFF` |
| Card background | `COLORS.bgSecondary` | `#FAFAFA` |
| Borders | `COLORS.border` | `#E5E7EB` |

---

## 🚀 Next Steps

1. ✅ `theme.js` is already updated with the new colors
2. 📋 Start replacing colors in components one file at a time
3. 🧪 Test each component as you update it
4. ✨ Your app will have a consistent, modern look!

---

## 💡 Tips

- Always import `COLORS` from `theme.js` at the top of files
- Use `COLORS.primary` instead of hardcoding hex codes
- This makes future color changes easy - just update one place!
- The MUI theme automatically applies these colors to default components
- Dark mode is supported - colors will adapt automatically

Happy theming! 🎨
