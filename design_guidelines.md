# Design Guidelines: Operational Intelligence Platform

## Design Approach

**Selected System:** Material Design with enterprise data-visualization patterns
**Rationale:** Information-dense productivity application requiring clear hierarchy, efficient workflows, and robust component library for dashboards, tables, and charts.

## Core Design Principles

1. **Data First:** Prioritize information density and readability over decorative elements
2. **Operational Efficiency:** Minimize clicks, enable quick scanning, support rapid decision-making
3. **Hierarchy Through Scale:** Use size, weight, and spacing to create clear information hierarchy
4. **Consistency:** Maintain uniform patterns across all dashboard views

## Typography System

**Font Stack:** Inter or Roboto via Google Fonts CDN

**Hierarchy:**
- Page Titles: 32px, weight 700
- Section Headers: 24px, weight 600
- Card Titles: 18px, weight 600
- Metric Labels: 14px, weight 500, uppercase, letter-spacing 0.5px
- Metric Values: 36px, weight 700 (large KPIs), 24px weight 600 (card metrics)
- Body Text: 16px, weight 400, line-height 1.5
- Table Headers: 14px, weight 600
- Table Data: 14px, weight 400
- Small Labels: 12px, weight 500

## Layout System

**Spacing Units:** Use Tailwind's 4, 6, 8, 12, 16, 24 units consistently
- Component padding: p-6
- Card spacing: gap-6
- Section margins: mb-8
- Page container: max-w-7xl mx-auto px-6

**Grid Patterns:**
- Dashboard KPI cards: 4-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Data tables: Full-width with horizontal scroll on mobile
- Chart sections: 2-column grid for comparative views (grid-cols-1 lg:grid-cols-2)
- Detail panels: 70/30 split for main content and sidebar

## Component Library

### Navigation
- **Top Navigation Bar:** Full-width, sticky, contains logo, main nav links, user profile, notifications
- **Sidebar (Optional):** Collapsible left sidebar for secondary navigation in dense views
- **Breadcrumbs:** For hierarchical navigation (CEO → Region → Branch → Customer)

### Dashboard Cards
- **Structure:** Rounded corners (rounded-lg), elevated shadow (shadow-md), padding p-6
- **KPI Cards:** Icon + Label + Large Value + Change indicator (+/- percentage)
- **Chart Cards:** Title + Subtitle + Chart area + Legend
- **Mini Cards:** Compact metrics for branch performance grids

### Data Tables
- **Header Row:** Sticky headers, sortable columns with arrows, bold text
- **Data Rows:** Alternating subtle row highlighting, hover state
- **Density:** Compact padding (py-3 px-4) for operational efficiency
- **Actions:** Row actions on hover, bulk actions in table header
- **Pagination:** Bottom-aligned, show page numbers and items per page selector

### Forms & Inputs
- **Upload Zone:** Large drag-drop area with dashed border, icon, and instructions
- **File Preview:** Scrollable table preview before confirmation
- **Input Fields:** Clear labels above inputs, helper text below, validation states
- **Buttons:** Primary (filled), Secondary (outlined), Text (minimal)

### Charts (Chart.js)
- **Types:** Line charts (trends), Bar charts (comparisons), Doughnut charts (composition), Heatmaps (regional performance)
- **Styling:** Clean axes, subtle gridlines, clear legends, responsive tooltips
- **Spacing:** Generous padding around charts (p-8)

### Alerts & Badges
- **Status Badges:** Pill-shaped, small text (12px), for loan status, risk levels
- **Alert Banners:** Top-aligned, full-width, dismissible, with icons
- **Fraud Flags:** Prominent visual indicators with confidence scores

### Modal Dialogs
- **Model Training:** Centered overlay with progress indicators
- **Customer Details:** Slide-in panel from right side
- **Confirmations:** Centered, focused, with clear action buttons

## Page-Specific Layouts

### CEO Dashboard
- Top row: 4 large KPI cards (Disbursements, Collection Rate, Arrears, PAR)
- Second row: Regional performance heatmap (left 2/3) + Branch rankings list (right 1/3)
- Third row: Trend charts (2-column grid)
- Bottom: Recent alerts table

### Fraud Center
- Header with filters (date range, risk threshold, branch selector)
- Main area: Fraud cases table with risk scores, ML confidence, agent explanations
- Right sidebar: Model performance metrics, retraining status
- Detail modal: Full customer fraud analysis with all signals and agent reasoning

### Branch Performance
- Branch selector dropdown at top
- Tabs: Daily / Weekly / Monthly views
- KPI row: Performance metrics vs targets with progress bars
- Chart area: Performance trends, collection patterns
- Projections panel: Mid-month and end-month forecasts with confidence intervals

### Customer Profile
- Header: Customer name, ID, primary branch, AI limit score (large, prominent)
- Info grid: Demographics, business type, historical cycles (2-3 column grid)
- Timeline: Vertical loan and repayment history
- Risk indicators: Behavior patterns, churn probability, fraud score (card layout)

### CSV Upload Interface
- Large centered upload zone (min-height 400px)
- File type auto-detection indicator
- Groq inference results: Detected schema, destination table, confidence score
- Data preview table (first 50 rows)
- Confirmation panel with mapping review

## Responsive Behavior

**Mobile (< 768px):**
- Single column layouts
- Collapsible navigation to hamburger menu
- Horizontal scroll tables
- Stacked KPI cards

**Tablet (768px - 1024px):**
- 2-column grids where appropriate
- Condensed navigation
- Optimized chart sizes

**Desktop (> 1024px):**
- Full multi-column layouts
- Persistent navigation
- Maximum data density

## Interaction Patterns

- **Loading States:** Skeleton screens for tables and charts, spinner for actions
- **Empty States:** Helpful illustrations and CTAs when no data exists
- **Error States:** Clear error messages with recovery actions
- **Success Feedback:** Toast notifications for actions (upload complete, model trained)
- **Real-time Updates:** Subtle animation when data refreshes

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Focus indicators on all focusable elements
- Sufficient contrast for all text (check WCAG AA)
- Screen reader friendly table markup

## Performance Considerations

- Virtualized tables for large datasets (1000+ rows)
- Lazy loading for charts below fold
- Debounced search and filter inputs
- Optimistic UI updates for better perceived performance

This enterprise dashboard prioritizes clarity, efficiency, and data-driven decision-making through consistent Material Design patterns optimized for operational intelligence workflows.