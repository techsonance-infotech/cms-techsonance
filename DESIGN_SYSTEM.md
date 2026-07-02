# TechSonance Enterprise CMS - Unified Design System

This document outlines the visual standards, color tokens, layout specifications, and UI/UX component blueprints designed for the TechSonance CMS Portal. Use this system as a reference guide for updates, new features, and layout consistency.

---

## 1. Core Brand Colors

Our design language centers on a premium, clean, SaaS-dashboard style featuring rich gradients, soft borders, and interactive dark mode compatibility.

| Token | Hex Value | Tailwind Class Name | Usage Context |
| :--- | :--- | :--- | :--- |
| **Primary** | `#337BAA` | `bg-primary` / `text-primary` | Standard corporate brand elements, primary accents, active highlights |
| **Primary Dark** | `#245C80` | `bg-primary-dark` | Gradient start points, deeper interaction borders, hover actions |
| **Primary Light** | `#5EA8D4` | `bg-primary-light` | Light alert backgrounds, selection rings, interactive overlays |
| **Accent Cyan** | `#67D7E8` | `bg-accent-cyan` / `text-cyan-400` | Analytics bars, progressive trackers, decorative points |
| **Accent Aqua** | `#8EEAF4` | `bg-accent-aqua` | Interactive focus points, visual micro-indicators |
| **Sidebar Dark** | `#13293D` | `bg-sidebar` | Main vertical navigation shell backdrop |
| **Background Light** | `#F4F7FA` | `bg-background` | Global viewport background canvas |
| **Card Background** | `#FFFFFF` | `bg-card` | Containers, metrics blocks, interactive widgets |
| **Border Light** | `#D9E3EC` | `border-border` | Subtle dividers, form rings, layout panels |
| **Success** | `#22C55E` | `text-emerald-600` / `bg-emerald-50` | Active statuses, successful completions, metrics increments |
| **Warning** | `#F59E0B` | `text-amber-600` / `bg-amber-50` | Alerts, pending statuses, mid-priority actions |
| **Error / Urgent** | `#EF4444` | `text-rose-600` / `bg-rose-50` | Critical alarms, stockouts, overdue notifications, dangerous actions |

### Corporate Brand Gradient
- **CSS Style**: `linear-gradient(135deg, #245C80 0%, #337BAA 45%, #67D7E8 100%)`
- **Tailwind Helper Class**: `bg-brand-gradient` (mapped to `bg-gradient-to-r from-primary-dark via-primary to-accent-cyan`)

---

## 2. Typography & Layout Spacing

*   **Font Family**: `Inter` (Standard browser sans-serif stack as primary).
*   **Border Radius**:
    *   `rounded-xl` (12px) - Buttons, badge tags, form inputs.
    *   `rounded-2xl` (16px) - Cards, layout modules, bento components, popovers.
*   **Shadows**: `shadow-sm` / `shadow-md` with subtle opacity rules (e.g. `shadow-primary/10`).

---

## 3. UI Blueprints

### A. Buttons (`rounded-xl` / 12px)
Primary action buttons leverage our gorgeous gradient brand styling:

```tsx
// Primary Button
<Button className="bg-brand-gradient text-white hover:brightness-105 active:scale-[0.98] transition-all rounded-xl">
  Submit
</Button>

// Secondary Button
<Button variant="outline" className="border-border text-slate-700 hover:bg-slate-50 rounded-xl">
  Cancel
</Button>
```

### B. Cards (`rounded-2xl` / 16px)
SaaS bento grids are built using padded container blocks:

```tsx
<Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
  <CardHeader>
    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Active Users</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content goes here */}
  </CardContent>
</Card>
```

### C. Badges & Tags
Use soft backgrounds with saturated colored text for semantic status representation:

```tsx
// Active / Completed Status
<Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-bold uppercase text-[9px] py-1 px-2.5 rounded-xl">
  Active
</Badge>

// Pending / Warning
<Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none font-bold uppercase text-[9px] py-1 px-2.5 rounded-xl">
  Pending
</Badge>

// Critical / Overdue
<Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-none font-bold uppercase text-[9px] py-1 px-2.5 rounded-xl animate-pulse">
  Overdue
</Badge>
```

### D. Data Tables
Tables should incorporate padded breathing room, zebra rows, dynamic hover highlighting, and sticky headers:

```tsx
<table className="w-full text-xs text-left border-collapse">
  <thead>
    <tr className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-border">
      <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Item</th>
      <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-150 dark:divide-slate-850 font-medium">
    <tr className="hover:bg-primary-light/8 cursor-pointer transition-colors">
      <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">Item Name</td>
      <td className="px-6 py-4 text-right">42</td>
    </tr>
  </tbody>
</table>
```

---

## 4. Navigation & Collapsible Shell

To maintain usability as our platform grows, all navigation modules must be organized into **collapsible category containers** in the main sidebar.

### Organization Principles:
1.  **Icon Indicators**: Every parent category must have a distinctive `Lucide` icon.
2.  **Dropdown Chevrons**: Collapsible modules should render a trailing `ChevronDown` or `ChevronRight` icon to reflect their current status.
3.  **Active Gates**: The parent category must expand automatically if any nested child path is currently active.
