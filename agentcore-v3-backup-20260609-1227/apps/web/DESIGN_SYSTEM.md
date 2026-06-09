# AgentCore Design System
## Structured Intelligence — v3.0

---

## 1. Design Philosophy

### Concept: Structured Intelligence
Интеллект через структуру, порядок, систему.

**НЕ** AI-стартап. **НЕ** sci-fi. Это архитектурный продукт для профессионалов.

Референсы: legend.xyz, linear.app, notion.so, raycast.com

---

## 2. Color System (Light Theme)

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| --bg-primary | #F8F9FB | Main page background |
| --bg-surface | #FFFFFF | Cards, elevated surfaces |
| --bg-elevated | #F0F1F5 | Hover states, secondary surfaces |

### Ink (Neutral Scale)
| Token | Value | Usage |
|-------|-------|-------|
| ink-900 | #111318 | Primary text, headings, buttons |
| ink-700 | #2D313A | Secondary headings |
| ink-500 | #6B7080 | Body text, descriptions |
| ink-300 | #C5C9D4 | Borders, dividers, subtle elements |
| ink-200 | #E2E4EB | Card borders, light separators |
| ink-100 | #F0F1F5 | Subtle backgrounds |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| indigo | #4C5EFF | Primary accent, CTAs, highlights |
| indigo-50 | #E8F0FF | Subtle accent backgrounds |
| coral | #FF6B5B | Micro-accent, status indicators, hover details |

### Gradients
**Text Gradient (Indigo):** `linear-gradient(135deg, #4C5EFF 0%, #6B7CFF 100%)`
- Очень сдержанный, архитектурный
- НЕ неоновый, НЕ фиолетовый

---

## 3. Typography System

### Font Families
| Role | Font | Weights | Fallback |
|------|------|---------|----------|
| Display / Headings | Manrope | 400, 500, 600, 700, 800 | Inter, system-ui |
| Body / UI | Inter | 300, 400, 500, 600, 700 | system-ui |

### Type Scale (using CSS clamp)

| Level | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| H1 | clamp(3rem, 7vw, 6rem) | 1.05 | -0.03em | 700 | Hero title |
| H2 | clamp(2rem, 4vw, 3.5rem) | 1.10 | -0.02em | 700 | Section titles |
| H3 | clamp(1.25rem, 2vw, 1.75rem) | 1.30 | -0.02em | 600 | Card titles |
| H4 | clamp(1.1rem, 1.5vw, 1.35rem) | 1.35 | -0.01em | 600 | Sub-headings |
| Body Large | 1.125rem (18px) | 1.70 | -0.01em | 400 | Lead paragraphs |
| Body | 1rem (16px) | 1.60 | 0 | 400 | Standard text |
| Body Small | 0.875rem (14px) | 1.60 | 0 | 400 | Captions, metadata |
| Label | 0.75rem (12px) | 1.50 | 0.08em | 600 | Uppercase labels |
| Caption | 0.75rem (12px) | 1.50 | 0.02em | 500 | Small annotations |

### Rules
- **Headings:** Tight letter-spacing (-0.02em to -0.03em) для плотности
- **Labels:** Uppercase + positive tracking (0.08em) для читаемости
- **Body:** Slightly negative tracking (-0.01em) для элегантности
- **Variable weight** можно использовать на Manrope для анимаций weight

---

## 4. Spacing System

| Token | Value |
|-------|-------|
| section-padding | px-6 sm:px-10 lg:px-16 xl:px-24 |
| Card padding | p-6 to p-8 |
| Gap grid | gap-6 (24px) |
| Section vertical | py-32 (128px) |

---

## 5. Component Primitives

### Buttons

**Primary**
- bg: ink-900 (#111318)
- color: white
- padding: 14px 28px
- radius: 10px
- weight: 600
- hover: translateY(-2px), shadow, bg: #1A1D23
- transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1)

**Secondary**
- bg: white
- border: 1px solid ink-200
- hover: bg-elevated, border ink-300, translateY(-2px)

**Ghost**
- bg: transparent
- hover: bg ink-900/4

### Cards

**Standard Card**
- bg: #F8F9FB
- border: 1px solid ink-200/80
- radius: 16px (rounded-2xl)
- hover: translateY(-4px), shadow-lg

**Glass Card**
- bg: white/60
- backdrop-filter: blur(12px)
- border: 1px solid white/50
- shadow: soft

**Dark Card (CTA)**
- bg: ink-900
- Decorative: grid-lines opacity-10, blurred gradient orbs

### Navigation
- Glass surface: white/72 + blur(24px)
- Border bottom: ink-200/40
- Scroll behavior: hide on scroll-down, show on scroll-up

---

## 6. Logo System

### Symbol
4 модуля (2x2 сетка) + центральный core (круг):
- Топ-лево: ink-900 квадрат
- Топ-право: indigo квадрат
- Бот-лево: indigo квадрат
- Бот-право: ink-900 круг (core)

### Meaning
- Модули = системность, архитектура
- Core = центр процессов
- Геометрия = структура, порядок

### Variants
1. Full: Symbol + "AgentCore" wordmark
2. Symbol only: для favicon, мелких применений
3. Animated: stroke-reveal animation (SVG stroke-dashoffset)

---

## 7. Animation & Motion

### Easing Tokens
| Name | Value | Usage |
|------|-------|-------|
| ease-out-expo | cubic-bezier(0.16, 1, 0.3, 1) | Primary transitions |
| ease-out-quint | cubic-bezier(0.23, 1, 0.32, 1) | Secondary |
| spring | Framer Motion spring | Interactive elements |

### Scroll Behavior
- **Lenis smooth scroll**: duration 1.2, exponential easing
- **GSAP ScrollTrigger** for scroll-linked animations
- **Scroll progress bar**: 2px, gradient indigo, fixed top

### Hero Scroll Animation
1. Text scales down (0.85) and fades on scroll
2. Parallax 3 layers (different speeds)
3. Background grid zooms out subtly
4. Elements disperse with scroll

### Section Transitions
- Sticky blocks with scroll-linked reveals
- Text lines reveal via clip-path
- Cards appear through clip-path inset animation
- Grid transforms and "breaks" on scroll

### Micro-interactions
| Element | Effect | Details |
|---------|--------|---------|
| Buttons | Magnetic hover | Subtle pull toward cursor (strength 0.15-0.3) |
| Cards | Lift + depth | translateY(-6px), enhanced shadow |
| Links | Animated underline | scaleX from 0 to 1, transform-origin switch |
| Icons | Scale on hover | 1.05x - 1.1x |
| Scroll | Progress bar | ScaleX tied to scroll progress |

### Workflow Section
- Alternating layout (left/right)
- Step numbers: large, faded (ink-100)
- Visual blocks: structural diagrams with icons
- Connection lines between elements

---

## 8. Layout Architecture

### Page Structure
```
1. Immersive Hero (150vh for scroll space)
   - Parallax layers
   - Scale/opacity scroll-linked
   
2. Stats Bar (compact, data)
   
3. Value Proposition (2-col: text + diagram)
   - Structural diagram (4 modules)
   
4. Capabilities (3-col grid)
   - Grid "breaks" on scroll
   - One card becomes dominant
   
5. System Architecture (vertical stack)
   - 4 layers with connectors
   - Clip-path reveal
   
6. Workflow (3 steps, alternating)
   - Structural illustrations
   - Lines, geometry, grids
   
7. Pricing (3-col)
   - Glass light cards
   - Hover depth effect
   
8. Final CTA (dark card)
   - Clean, powerful
   
9. Footer
```

---

## 9. Technical Stack

### Core
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS 3.4

### Animation
- GSAP 3 + ScrollTrigger (scroll-linked animations)
- Lenis (smooth scroll)
- Framer Motion (hover states, micro-interactions)

### Fonts
- Google Fonts: Inter, Manrope
- Variable fonts ready (wght axis)

### CSS Strategy
- CSS Custom Properties for colors
- clamp() for fluid typography
- backdrop-filter for glass effects
- clip-path for reveals
- transform3d for GPU acceleration

---

## 10. Accessibility

- Color contrast: all text meets WCAG AA
- Focus states: visible outlines (2px indigo offset)
- Reduced motion: respect prefers-reduced-motion
- Semantic HTML: proper heading hierarchy

---

## 11. DO NOTs

- ❌ No neon gradients (purple/blue glowing)
- ❌ No sci-fi imagery (brains, circuits, holograms)
- ❌ No abstract AI illustrations
- ❌ No cyberpunk aesthetics
- ❌ No stock-looking icon cards
- ❌ No generic SaaS template look
- ❌ No dark theme (keep light)

## 12. DOs

- ✅ Light, airy backgrounds
- ✅ Structural geometry
- ✅ Grid lines and subtle patterns
- ✅ Architectural precision
- ✅ Premium minimalism
- ✅ Kinematic scroll
- ✅ Confident brand presence
