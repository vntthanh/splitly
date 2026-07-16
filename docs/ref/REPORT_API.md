# Report API Documentation

## Overview
The Report API provides comprehensive analytics and spending insights for users. It aggregates bill data, calculates metrics, and generates AI-powered spending insights.

---

## API Endpoint

### Get Monthly Report
**Endpoint:** `GET /api/v1/reports/:userId`

**Authentication:** Required (JWT Token)

**Query Parameters:**
- `year` (required): Year in YYYY format (e.g., 2025)
- `month` (required): Month as number 1-12 (1 = January, 12 = December)

**Example Request:**
```javascript
GET /api/v1/reports/507f1f77bcf86cd799439011?year=2025&month=11
```

---

## Response Structure

### Success Response (200 OK)

```typescript
{
  period: {
    year: number,              // Requested year
    month: number,             // Requested month (1-12)
    startDate: string,         // ISO date string for period start
    endDate: string            // ISO date string for period end
  },
  metrics: {
    totalSpending: {
      amount: number,          // Total amount spent in period
      change: number,          // Percentage change from previous month
      previousAmount: number   // Total amount spent in previous month
    },
    billCount: {
      count: number,           // Number of bills in period
      change: number,          // Percentage change from previous month
      previousCount: number    // Number of bills in previous month
    },
    overdueBills: {
      count: number,           // Number of overdue bills
      amount: number           // Total amount of overdue bills
    },
    unpaidDebt: {
      amount: number           // Total unpaid debt amount
    }
  },
  spendingTrend: [
    {
      day: number,             // Day of month (1-31)
      amount: number,          // Amount spent on that day
      date: string             // ISO date string
    }
  ],
  categoryBreakdown: [
    {
      category: string,        // Category name
      amount: number,          // Total amount in category
      count: number            // Number of bills in category
    }
  ],
  aiInsights: [
    {
      title: string,           // Insight title
      description: string,     // Detailed description
      suggestion: string       // Actionable suggestion
    }
  ]
}
```

### Example Response:

```json
{
  "period": {
    "year": 2025,
    "month": 11,
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-30T23:59:59.999Z"
  },
  "metrics": {
    "totalSpending": {
      "amount": 1500000,
      "change": 15.5,
      "previousAmount": 1298701
    },
    "billCount": {
      "count": 12,
      "change": 20.0,
      "previousCount": 10
    },
    "overdueBills": {
      "count": 2,
      "amount": 250000
    },
    "unpaidDebt": {
      "amount": 350000
    }
  },
  "spendingTrend": [
    {
      "day": 1,
      "amount": 50000,
      "date": "2025-11-01T00:00:00.000Z"
    },
    {
      "day": 2,
      "amount": 0,
      "date": "2025-11-02T00:00:00.000Z"
    }
    // ... days 3-30
  ],
  "categoryBreakdown": [
    {
      "category": "Ăn uống",
      "amount": 800000,
      "count": 6
    },
    {
      "category": "Di chuyển",
      "amount": 400000,
      "count": 4
    },
    {
      "category": "Mua sắm",
      "amount": 300000,
      "count": 2
    }
  ],
  "aiInsights": [
    {
      "title": "Phân tích chi tiêu trung bình",
      "description": "Trung bình bạn chi 125000 ₫ cho mỗi giao dịch. Số giao dịch tăng 20% so với tháng trước.",
      "suggestion": "Giá trị mỗi giao dịch tăng cao. Hãy xem xét các khoản chi tiêu lớn có thực sự cần thiết."
    },
    {
      "title": "Chi tiêu theo danh mục",
      "description": "Danh mục \"Ăn uống\" chiếm 53% tổng chi tiêu với 800000 ₫.",
      "suggestion": "Danh mục này chiếm phần lớn chi tiêu của bạn. Hãy xem xét có thể tối ưu hóa không."
    },
    {
      "title": "Tần suất chi tiêu",
      "description": "Bạn có chi tiêu trong 15 ngày trong tháng này.",
      "suggestion": "Tần suất chi tiêu của bạn khá hợp lý."
    }
  ]
}
```

### Error Responses:

**400 Bad Request** - Invalid or missing parameters
```json
{
  "statusCode": 400,
  "message": "Year and month parameters are required"
}
```

**403 Forbidden** - User trying to access another user's data
```json
{
  "statusCode": 403,
  "message": "You can only access your own report data"
}
```

**404 Not Found** - User not found
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

---

## Frontend Integration

### API Function

Located in: `web/src/apis/index.js`

```javascript
/**
 * Fetch monthly report data for a user
 * @param {string} userId - User ID
 * @param {number} year - Year (YYYY)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Report data including metrics, trends, and insights
 */
export const fetchMonthlyReportAPI = async (userId, year, month) => {
  const response = await authorizedAxiosInstance.get(
    `${API_ROOT}/v1/reports/${userId}?year=${year}&month=${month}`
  )
  return response.data
}
```

### Usage Example

```javascript
import { fetchMonthlyReportAPI } from '~/apis'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'

const Report = () => {
  const currentUser = useSelector((state) => state.user.currentUser)
  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const year = selectedMonth.year()
      const month = selectedMonth.month() + 1 // dayjs months are 0-indexed
      
      const data = await fetchMonthlyReportAPI(currentUser._id, year, month)
      setReportData(data)
    }
    
    fetchData()
  }, [selectedMonth, currentUser])
  
  // Use reportData...
}
```

---

## Data Calculations

### Total Spending
Sum of all `amountOwed` for the user across all bills in the period.

### Bill Count
Total number of bills created in the period where user is a participant.

### Overdue Bills
Bills where:
- User hasn't fully paid (`isPaid` = false)
- Payment deadline has passed
- Calculated amount is `amountOwed - amountPaid`

### Unpaid Debt
Total remaining debt across all unpaid bills in the period.

### Spending Trend
Daily aggregation of spending throughout the month. Each day shows total amount owed on bills created that day.

### Category Breakdown
Spending grouped by bill category, sorted by amount (highest first).

### AI Insights
Automatically generated insights based on:
1. **Average Transaction Analysis**: Compares average spending per bill with previous month
2. **Category Analysis**: Identifies dominant spending categories
3. **Frequency Analysis**: Analyzes spending patterns and frequency

---

## Naming Conventions

### API Endpoints
- Use plural nouns: `/reports` not `/report`
- Use kebab-case for multi-word resources
- Include version: `/v1/reports`

### Request Parameters
- Use camelCase: `userId`, `year`, `month`
- Be explicit: `year` not `y`, `month` not `m`

### Response Fields
- Use camelCase for all fields
- Use descriptive names: `totalSpending` not `spending`
- Group related data: `metrics.totalSpending.amount`

### Database Queries
- Use descriptive function names: `getBillsByUser()`
- Follow existing model patterns
- Convert string IDs to ObjectId consistently

---

## Security

1. **Authentication Required**: All endpoints require valid JWT token
2. **Authorization Check**: Users can only access their own report data
3. **Input Validation**: Year and month parameters are validated
4. **Error Handling**: Comprehensive error handling with appropriate status codes

---

## Performance Considerations

1. **Data Aggregation**: Calculations are done in-memory after fetching bills
2. **Filtering**: Bills are filtered by date range before processing
3. **Caching Opportunity**: Consider implementing Redis cache for frequently accessed reports
4. **Pagination**: Not needed as report data is already filtered by month

---

## Future Enhancements

1. **Chart Data**: Add formatted data ready for chart libraries
2. **Export Functionality**: PDF/Excel export capabilities
3. **Custom Date Ranges**: Support for arbitrary date ranges
4. **Comparison View**: Compare multiple periods side by side
5. **Advanced Analytics**: Predictive spending, budgets, savings goals
