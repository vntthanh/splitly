# Chart Components Documentation

## Overview
This document describes the two chart components created for the Report page: SpendingTrendChart and CategorySpendingChart. Both components are built using Recharts library and are fully responsive with Material-UI theming.

---

## 1. SpendingTrendChart - Line Chart

### Purpose
Displays spending trends over time with dual Y-axes showing both monetary amounts and bill counts.

### Location
`/web/src/components/charts/SpendingTrendChart.jsx`

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | Array | No | `[]` | Array of spending trend data points |
| `title` | String | No | `'Xu hướng chi tiêu'` | Chart title |

### Data Structure

```typescript
interface SpendingTrendData {
  date: string        // Date in 'YYYY-MM-DD' format
  totalAmount: number // Total spending amount in VND
  billCount: number   // Number of bills created on this date
}

// Example:
const sampleData = [
  { date: '2025-11-01', totalAmount: 150000, billCount: 2 },
  { date: '2025-11-02', totalAmount: 0, billCount: 0 },
  { date: '2025-11-03', totalAmount: 300000, billCount: 1 },
  { date: '2025-11-04', totalAmount: 450000, billCount: 3 },
  // ... more days
]
```

### Features

#### 1. **Dual Y-Axes**
- **Left Y-Axis**: Displays monetary amounts (₫)
  - Automatically formats large numbers (K for thousands, M for millions)
  - Example: 1,500,000 → 1.5M
- **Right Y-Axis**: Displays bill count (number)
  - Simple integer display

#### 2. **Shared X-Axis**
- Shows dates in DD/MM format
- Automatically aggregates to weekly view on mobile if more than 15 data points
- Angled labels on mobile for better readability

#### 3. **Responsive Behavior**
- **Mobile (<600px)**:
  - Smaller chart elements
  - Reduced margins and padding
  - Angled X-axis labels (-45°)
  - Auto-aggregation to weekly view for large datasets
  - Smaller dot sizes (r=3) and active dots (r=5)
  
- **Tablet (600px-900px)**:
  - Medium-sized elements
  - Standard layout
  
- **Desktop (>900px)**:
  - Full-sized elements
  - Y-axis labels displayed
  - Larger dots (r=4) and active dots (r=6)

#### 4. **Interactive Elements**

**Tooltip:**
- Custom styled card with Material-UI theming
- Shows both values simultaneously:
  - Monetary amount formatted with thousand separators
  - Bill count as integer
- Color-coded legend markers
- Displays date label

**Legend:**
- Shows both lines with their names:
  - "Tổng chi tiêu" (Total Spending) - Pink/Red
  - "Số hóa đơn" (Bill Count) - Blue
- Positioned at bottom
- Responsive font sizes

#### 5. **Visual Styling**
- **Grid**: Dashed grid lines with theme-aware opacity
- **Lines**:
  - Total Amount: Primary theme color (#EF9A9A)
  - Bill Count: Blue (#2196F3)
  - 2px stroke width
  - Smooth monotone curves
- **Dots**: Filled circles with stroke
- **Active State**: Larger dots on hover

#### 6. **Empty State**
Displays "Không có dữ liệu trong kỳ này" when no data available

### Usage Example

```jsx
import SpendingTrendChart from '~/components/charts/SpendingTrendChart'

const ReportPage = () => {
  const trendData = [
    { date: '2025-11-01', totalAmount: 150000, billCount: 2 },
    { date: '2025-11-02', totalAmount: 0, billCount: 0 },
    { date: '2025-11-03', totalAmount: 300000, billCount: 1 },
    // ... more data
  ]

  return (
    <SpendingTrendChart 
      data={trendData} 
      title="Xu hướng chi tiêu tháng 11"
    />
  )
}
```

---

## 2. CategorySpendingChart - Pie Chart

### Purpose
Displays spending distribution across different categories with percentages and amounts.

### Location
`/web/src/components/charts/CategorySpendingChart.jsx`

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | Array | No | `[]` | Array of category spending data |
| `title` | String | No | `'Chi tiêu theo danh mục'` | Chart title |

### Data Structure

```typescript
interface CategorySpendingData {
  category: string  // Category name (e.g., "Ăn uống", "Di chuyển")
  amount: number    // Total amount spent in this category
  count?: number    // Optional: Number of bills in this category
}

// Example:
const sampleData = [
  { category: 'Ăn uống', amount: 800000, count: 6 },
  { category: 'Di chuyển', amount: 400000, count: 4 },
  { category: 'Mua sắm', amount: 300000, count: 2 },
  { category: 'Giải trí', amount: 200000, count: 3 },
  { category: 'Khác', amount: 100000, count: 1 },
]
```

### Features

#### 1. **Color Palette**
18 predefined colors for consistency:
- Primary theme colors (pink/red variants)
- Material Design colors (purple, blue, green, etc.)
- Automatically cycles through colors for categories

```javascript
const CATEGORY_COLORS = [
  '#EF9A9A', // Light pink
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep purple
  // ... 14 more colors
]
```

#### 2. **Percentage Display**
- **In Slice Labels**: Shows percentage if > 5% of total
  - White text with shadow for visibility
  - Positioned in center of slice
  - Format: "XX%" (no decimals)
  
- **In Tooltip**: Shows decimal percentage
  - Format: "XX.X% tổng chi tiêu"

#### 3. **Center Label**
- Shows total amount in center of donut chart
- Format: "Tổng: XXX,XXX ₫"
- Hidden on mobile to save space

#### 4. **Responsive Behavior**

**Mobile (<600px)**:
- Outer radius: 60px, Inner radius: 35px
- Smaller dot sizes in legend
- Single column legend
- Scrollable legend (max height: 120px)
- No center label

**Tablet (600px-900px)**:
- Outer radius: 70px, Inner radius: 40px
- Two-column legend
- Medium-sized elements

**Desktop (>900px)**:
- Outer radius: 80px, Inner radius: 45px
- Two-column legend
- Full-sized elements
- Center label visible

#### 5. **Interactive Elements**

**Tooltip:**
- Custom Material-UI card
- Shows:
  - Category name with color indicator
  - Formatted amount (XXX,XXX ₫)
  - Percentage of total (X.X%)
  - Bill count (if provided)

**Legend:**
- Custom scrollable legend
- Grid layout (1 or 2 columns based on screen size)
- Color square + category name
- Truncated text with ellipsis
- Full name on hover (title attribute)

#### 6. **Donut Chart Style**
- Inner radius creates donut effect
- 2° padding angle between slices
- Smooth transitions
- No stroke on slices

#### 7. **Accessibility**
- Color indicators for each category
- Full category names in legend
- Tooltip shows complete information
- Title attributes for truncated text

#### 8. **Empty State**
Displays "Không có dữ liệu" when no categories available

### Usage Example

```jsx
import CategorySpendingChart from '~/components/charts/CategorySpendingChart'

const ReportPage = () => {
  const categoryData = [
    { category: 'Ăn uống', amount: 800000, count: 6 },
    { category: 'Di chuyển', amount: 400000, count: 4 },
    { category: 'Mua sắm', amount: 300000, count: 2 },
  ]

  return (
    <CategorySpendingChart 
      data={categoryData}
      title="Phân bổ chi tiêu theo danh mục"
    />
  )
}
```

---

## Integration with Report Page

### Data Flow

1. **Backend API** (`/api/v1/reports/:userId`)
   ```json
   {
     "spendingTrend": [
       { "day": 1, "amount": 150000, "count": 2, "date": "2025-11-01T00:00:00.000Z" },
       // ... more days
     ],
     "categoryBreakdown": [
       { "category": "Ăn uống", "amount": 800000, "count": 6 },
       // ... more categories
     ]
   }
   ```

2. **Frontend Data Preparation** (in Report.jsx)
   ```javascript
   const getSpendingTrendData = () => {
     if (!reportData?.spendingTrend) return []
     
     return reportData.spendingTrend.map((dayData) => ({
       date: dayData.date.split('T')[0],
       totalAmount: dayData.amount || 0,
       billCount: dayData.count || 0,
     }))
   }

   const getCategorySpendingData = () => {
     if (!reportData?.categoryBreakdown) return []
     return reportData.categoryBreakdown
   }
   ```

3. **Component Rendering**
   ```jsx
   <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
     <SpendingTrendChart data={getSpendingTrendData()} />
     <CategorySpendingChart data={getCategorySpendingData()} />
   </Box>
   ```

---

## Styling & Theming

Both components use Material-UI's theme system:

```javascript
const theme = useTheme()

// Access theme colors
theme.palette.text.primary
theme.palette.text.secondary
theme.palette.divider
theme.palette.background.paper

// Responsive breakpoints
const isMobile = useMediaQuery(theme.breakpoints.down('sm'))   // <600px
const isTablet = useMediaQuery(theme.breakpoints.down('md'))   // <900px
```

### Custom Colors
- Primary: `COLORS.primary` (#EF9A9A - from theme)
- Secondary: `#2196F3` (Blue - for bill count)
- Category colors: Predefined 18-color palette

---

## Performance Considerations

1. **Data Filtering**
   - Zero values are filtered out where appropriate
   - Only meaningful data is rendered

2. **Responsive Aggregation**
   - Line chart auto-aggregates daily data to weekly on mobile
   - Reduces render complexity for large datasets

3. **Memoization Opportunities**
   - Consider memoizing data preparation functions
   - Use `useMemo` for expensive calculations

4. **Recharts Optimization**
   - ResponsiveContainer handles resizing efficiently
   - Minimal re-renders with proper data structure

---

## Future Enhancements

### SpendingTrendChart
1. **Zoom & Pan**: Add ability to zoom into specific date ranges
2. **Data Export**: Export chart data to CSV/Excel
3. **Comparison Mode**: Show multiple months overlaid
4. **Annotations**: Mark important events or milestones
5. **Custom Aggregation**: User-selectable daily/weekly/monthly views

### CategorySpendingChart
1. **Interactive Filtering**: Click category to filter Report page
2. **Sub-categories**: Drill-down into category details
3. **Budget Indicators**: Show budget vs actual
4. **Trend Arrows**: Show if category spending increased/decreased
5. **Custom Colors**: User-defined category colors

---

## Testing Recommendations

### Unit Tests
1. Test with empty data arrays
2. Test with single data point
3. Test with large datasets (>100 points)
4. Test percentage calculations
5. Test date formatting
6. Test currency formatting

### Visual Tests
1. Verify responsive behavior at different breakpoints
2. Check tooltip positioning and content
3. Verify legend layout and scrolling
4. Test color contrast and accessibility
5. Check empty state rendering

### Integration Tests
1. Test data flow from API to charts
2. Verify chart updates when month changes
3. Test loading states
4. Test error handling

---

## Dependencies

- **recharts**: ^2.x - Chart library
- **@mui/material**: ^7.x - UI components and theming
- **@mui/icons-material**: ^7.x - Icons
- **dayjs**: ^1.x - Date formatting (indirect)

---

## Accessibility

Both components follow accessibility best practices:
1. ✅ Semantic HTML structure
2. ✅ Color contrast meets WCAG AA standards
3. ✅ Text labels for all data points
4. ✅ Keyboard navigation (via Recharts)
5. ✅ Screen reader friendly tooltips
6. ✅ Responsive text sizing

---

## Browser Support

Tested and supported on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)
