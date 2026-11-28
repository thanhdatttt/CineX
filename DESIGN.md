---
name: Cinematic Prestige (Dual-Theme)
brand: CineX
themes:
  - dark: Gold & Midnight Black (Default)
  - light: Champagne & Warm Alabaster
typography:
  display: Space Grotesk
  body: Inter
roundness: ROUND_FULL
accent_color: "#F5C518"
---

# Design System: CineX (Complete Specification)

## 1. Brand Identity & Visual Language
Aura Cinemas is a luxury, high-prestige cinema booking platform designed for discerning moviegoers and Black Diamond VIP members. It supports two cohesive visual modes:
- **Dark Mode (*Cinematic Prestige*)**: Deep midnight blacks, warm charcoal surfaces, and radiant cinematic gold (`#F5C518`) for an immersive theater atmosphere.
- **Light Mode (*Champagne & Warm Alabaster*)**: Luminous alabaster canvases, crisp ivory cards, and burnished amber gold (`#C99700`) reminiscent of boutique luxury hotel lobbies.

---

## 2. Color Palette & Design Tokens

### A. Brand & Accent Colors
| Token | Dark Mode | Light Mode | Usage |
|---|---|---|---|
| **Primary Accent** | `#F5C518` | `#C99700` | Primary CTAs, active tabs, selected seats, ratings |
| **Primary Hover** | `#D4A514` | `#B08400` | Button hover/pressed states |
| **Accent Subtle** | `rgba(245, 197, 24, 0.15)` | `rgba(201, 151, 0, 0.12)` | Active pill backgrounds, VIP badges |
| **Accent Glow** | `rgba(245, 197, 24, 0.35)` | `rgba(201, 151, 0, 0.25)` | CTA focus rings, selected seat perimeter |

### B. Surface & Background Hierarchy
| Token | Dark Mode | Light Mode | Usage |
|---|---|---|---|
| **Canvas / Root** | `#0B0B0F` | `#F9F8F5` | Page background |
| **Surface Lowest** | `#0E0E12` | `#F4F1E9` | Recessed areas, booked seats, footer |
| **Surface Base / Card** | `#18181F` | `#FFFFFF` | Movie cards, ticket passes, modals |
| **Surface Elevated** | `#22222A` | `#FAF9F6` | Dropdowns, hover states, summary drawers |
| **Surface Interactive** | `#292930` | `#EFECE4` | Available seats, secondary buttons, inputs |
| **Border Subtle** | `rgba(255, 255, 255, 0.08)` | `#E7E3D8` | Card outlines, dividers, ticket perforations |
| **Border Highlight** | `rgba(245, 197, 24, 0.40)` | `rgba(201, 151, 0, 0.45)` | Active selections, VIP tier cards |

### C. Typography & Content Colors
| Token | Dark Mode | Light Mode | Usage |
|---|---|---|---|
| **Text Primary** | `#FFFFFF` | `#1C1A17` | Headlines, movie titles, primary values |
| **Text Secondary** | `#A1A1AA` | `#615C52` | Synopses, metadata, subtitles |
| **Text Muted** | `#71717A` | `#8C8577` | Timestamps, captions, disabled states |
| **Text on Primary** | `#0B0B0F` | `#FFFFFF` | Text inside primary gold CTA buttons |

### D. Status & Semantic Colors
- **Success / Confirmed**: `#22C55E`
- **Danger / Reserved / Urgent**: `#EF4444`
- **Warning / Hold Timer**: `#F59E0B`
- **Info / Format Tech**: `#38BDF8`

---

## 3. Typography Hierarchy

| Style | Font Family | Weight | Size (Desktop / Mobile) | Line Height | Tracking |
|---|---|---|---|---|---|
| **Display 1 (Hero)** | Space Grotesk | 700 | `48px–64px` / `32px` | `1.1` | `-0.02em` |
| **Heading 1 (Section)** | Space Grotesk | 700 | `28px–32px` / `22px` | `1.2` | `-0.01em` |
| **Heading 2 (Card Title)** | Space Grotesk | 600 | `20px–24px` / `18px` | `1.3` | `normal` |
| **Overline / Category** | Space Grotesk | 600 | `12px–13px` / `11px` | `1.4` | `+0.10em` (Uppercase) |
| **Body (Default)** | Inter | 400 | `14px–15px` / `14px` | `1.5` | `normal` |
| **Body Small / Meta** | Inter | 400–500 | `12px–13px` / `12px` | `1.4` | `normal` |
| **Button / Badge** | Space Grotesk | 600–700 | `13px–15px` / `13px` | `1.0` | `+0.02em` |

---

## 4. Layout, Shells & Responsive Architecture

### Desktop Shell (`web_standard`)
- **Top Navigation Bar**: Brand emblem + IMAX/VIP tag, location selector, primary nav links (*Now Showing, Experiences, Theatres, My Bookings, Offers*), `⌘K` search bar, **Light/Dark Theme Toggle**, `Book Now` CTA, and VIP Member avatar.
- **Footer**: Multi-column links (*Curated Cinema, Guest Services*), Premiere Access email input, and legal/concierge links.

### Mobile Shell (`mobile_tab` — 390px)
- **Top App Bar**: Compact Aura Cinemas logo, location subtitle, theme toggle icon, notification bell, and profile trigger.
- **Bottom Tab Bar**: Fixed 4-tab navigation (*Explore, Movies, Tickets, Concierge*) with active gold indicator.

---

## 5. Elevation, Radii & Special Effects
- **Border Radius**:
  - `rounded-full` (`9999px`): Pill buttons, format tags, status chips, theme toggle, avatars.
  - `rounded-2xl` (`16px`): Movie poster cards, seat map containers, VIP e-ticket passes.
  - `rounded-xl` (`12px`): Showtime pills, hospitality add-on cards, input fields.
- **Glassmorphism**: `backdrop-blur-md` with `bg-[#18181F]/80` (Dark) or `bg-white/85` (Light).
- **Shadows**:
  - Dark Mode Card: `0 10px 30px -10px rgba(0, 0, 0, 0.6)`
  - Light Mode Card: `0 8px 24px -6px rgba(28, 25, 23, 0.06)`
  - Gold CTA Glow: `0 0 25px rgba(245, 197, 24, 0.35)`
- **Cinema Motifs**:
  - **Curved Laser Screen Arch**: Linear/radial gradient fading from primary gold (`60%` opacity) to transparent.
  - **Perforated e-Ticket**: Dashed horizontal divider with semicircular side cutouts separating event details from the scannable QR code.

---

## 6. Core Component Patterns
- **Theme Switcher**: Segmented pill (`Light ☀️ / Dark 🌙`) in desktop header; compact icon button in mobile app bar.
- **Movie Card**: `2:3` vertical poster with top-left format badges (`IMAX LASER`, `70MM`, `DOLBY ATMOS`), top-right star rating, title, genre/runtime meta, and interactive showtime pills.
- **Seat Map**:
  - *Available*: `#292930` (Dark) / `#EFECE4` (Light)
  - *Selected*: `#F5C518` (Dark) / `#C99700` (Light) with glow & checkmark
  - *Booked*: `#131317` (Dark) / `#E7E3D8` (Light) with `×` glyph
  - *Tiers*: Standard (Rows A–D), VIP Motorized Recliners (Rows E–G), Couple Daybeds (Row H).
- **VIP e-Ticket Pass**: Perforated card with movie backdrop header, auditorium/gate info, seat & butler delivery status, high-contrast QR code with centered gold emblem, and `Add to Apple Wallet` CTA.