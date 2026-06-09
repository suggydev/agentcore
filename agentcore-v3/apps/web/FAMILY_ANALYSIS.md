# Family.co — Reverse Engineering Analysis

## Дизайн-система

### Цвета
- **Background**: `#fbfaf9` (beige — color(display-p3 0.984 0.98 0.976))
- **Background Alt**: `#f6f4ef` (beige-dark — rgb(246, 244, 239))
- **Text Primary**: `#343433` (body — color(display-p3 0.286 0.267 0.251))
- **Text Heading**: `#171717` (heading — rgb(23, 23, 23))
- **Text Muted**: `#848281` (body-muted — color(display-p3 0.518 0.51 0.506))
- **Primary Button**: `#171717` (dark) with white text
- **Secondary Button**: `#f6f4ef` with `#121212` text
- **Accent**: `#ff3e00` (orange — color(display-p3 1 0.325 0.063))
- **Gold**: `#c98e30` (color(display-p3 0.792 0.573 0.188))
- **Green**: `#43c679` (color(display-p3 0.267 0.776 0.498))
- **Gray**: `#74747a` (color(display-p3 0.455 0.455 0.518))
- **Border**: `#f2f0ed` (gray-light — color(display-p3 0.949 0.941 0.929))
- **Card Border**: inset box-shadow `color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset`
- **Dark Section**: `#121212` (rgb(18, 18, 18))

### Типографика
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif
- **H1**: 68px, font-weight 500, line-height 1.09, letter-spacing -2.11px
- **H2**: 44px, font-weight 500, line-height 1.09, letter-spacing -1.14px
- **H3**: 23px, font-weight 500, line-height 1.09, letter-spacing -0.25px
- **Body**: 17px, font-weight 400, line-height 1.47, letter-spacing -0.22px
- **Body Small**: 15px, font-weight 400, line-height 1.47, letter-spacing -0.2px
- **Caption**: 14px, font-weight 500, line-height 1.55, letter-spacing -0.18px
- **Button**: 15px, font-weight 500, border-radius 32px
- **CTA Button**: 17px, font-weight 500, border-radius 32px

### Кнопки
- **Primary**: bg #171717, text white, border-radius 32px, padding 0px 24px, height ~52px
- **Secondary**: bg #f6f4ef, text #121212, border-radius 32px, padding 0px 20px, height ~52px
- **Small**: bg #f6f4ef, text #121212, border-radius 32px, padding 0px 14px, height ~36px, font-size 15px
- **Hover**: opacity 0.9 или transition-colors

### Карточки
- **Border**: inset box-shadow `color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset`
- **Border-radius**: 10px
- **Padding**: 24px
- **Background**: white
- **No drop shadows** — только inset border

### Навигация
- **Height**: 64px (4rem)
- **Background**: rgba(251, 250, 249, 0.9) + backdrop-filter: blur(12px)
- **Links**: 14px, font-weight 500, color #343433, hover #848281
- **Logo**: SVG + текст "Family" / "AgentCore"
- **Border-radius**: 32px для кнопок

## Структура страницы

### Section 0: Hero (SectionIntro)
- **Heading**: "Your favorite crypto wallet."
- **Subheading**: "Explore Ethereum with the best wallet for iOS."
- **CTA**: "Download on iOS" (primary) + "Watch the Video" (secondary)
- **Visual**: 3D phone mockup с анимацией
- **Background**: beige (#fbfaf9)
- **Layout**: Centered, max-width ~800px

### Section 1: Features Grid (SectionExplore)
- **Heading**: "Explore Ethereum in a whole new way."
- **3 Cards**: Send, Receive, Swap
- **Card Style**: Icon + title + description
- **Background**: beige
- **Layout**: 3-column grid

### Section 2: Send/Receive/Swap (SectionSendReceiveSwap)
- **Heading**: "Send, receive, swap. All in one place."
- **Visual**: Phone mockup с экраном swap
- **Tabs**: Send, Receive, Swap (interactive)
- **Background**: beige

### Section 3: Feature Cards (SectionFeatures)
- **Cards**: Send & Receive, Swap, Multi Wallet
- **Each card**: Icon + heading + description + phone mockup
- **Background**: beige
- **Layout**: 3-column cards

### Section 4: NFTs (SectionNFTs)
- **Heading**: "The best way to experience NFTs."
- **Subheading**: "View NFTs in their ideal intended format."
- **Visual**: Phone mockup с NFT gallery
- **Background**: beige

### Section 5: Watch Wallets (SectionAccessible)
- **Heading**: "Watch the wallets you care about."
- **Subheading**: "Keep up to date with unlimited wallets..."
- **Visual**: Phone mockup с watch-only mode
- **Background**: beige

### Section 6: Activity (SectionPrecision)
- **Heading**: "Wallet activity you can understand."
- **Subheading**: "Your transactions and wallet history is readable..."
- **Visual**: Phone mockup с transaction history
- **Background**: beige

### Section 7: Security (SectionSafety)
- **Heading**: "Relentless protection. Restful ease."
- **Subheading**: "Family is fully self-custodial..."
- **Visual**: Phone mockup с security screen
- **Background**: beige

### Section 8: Onboarding (SectionOnboarding)
- **Heading**: "Effortless onboarding. Masterful management."
- **Tabs**: Onboarding, Mission Control, Drag and Drop
- **Visual**: Phone mockup с onboarding flow
- **Background**: beige

### Section 9: Blog (SectionBlog)
- **Heading**: "The latest from Family"
- **Cards**: 3 blog posts
- **Background**: beige

### Section 10: Details (SectionDetails)
- **Heading**: "Details that matter."
- **Subheading**: "We sweat the details, no matter how small."
- **Features**: Real-time monitor, Track transactions, etc.
- **Background**: beige

### Section 11: Testimonials (Testimonials)
- **Heading**: "Friends of Family"
- **Subheading**: "See what people are saying."
- **Tweets**: 3 tweet cards with avatars
- **Background**: beige

### Section 12: FAQ (SectionFAQs)
- **Heading**: "Frequently Asked Questions"
- **Accordion**: expandable items
- **Background**: beige

### Section 13: CTA (CallToAction)
- **Heading**: "Explore Family"
- **Subheading**: "Family is a beautiful self-custody Ethereum wallet..."
- **CTA**: "Download on iOS" (primary) + "Watch the Video" (secondary)
- **Background**: Dark section (#121212) or beige

### Footer
- **Logo**: SVG + текст
- **Links**: Developers, Resources, ConnectKit, Family, Blog, Changelog, Help, FAQs, X
- **Copyright**: © 2025 Family.co
- **Background**: beige

## Анимации

### Scroll Animations
- **Hero parallax**: Phone mockup moves slightly on scroll
- **Section reveals**: Elements fade in + slide up on scroll
- **Stagger**: Cards animate in with staggered delay

### Micro-interactions
- **Button hover**: opacity 0.9, transition 0.2s
- **Card hover**: subtle scale or shadow change
- **Tab switching**: smooth content transition
- **Accordion**: smooth height animation

### Phone Mockups
- **3D perspective**: phones have slight rotation
- **Scroll-triggered**: phones move/rotate on scroll
- **Parallax**: different scroll speeds for elements

## Спецификация для адаптации

### Агенткор-версия
- **Hero**: "Ваш цифровой сотрудник" + "Создайте AI-агента за 2 минуты"
- **CTA**: "Записаться на демо" + "Создать бесплатно"
- **Features**: Отвечает, Записывает, Продаёт
- **Cards**: Консультации, Запись, Продажи
- **Use Cases**: Цветочный, Салон, Автосервис, Магазин, Клиника, Риэлтор
- **Results**: 35% рост конверсии, 15ч экономия, 40% броней без админа, 80% вопросов автоматом
- **Testimonials**: Асхат, Гульнара, Серик, Ержан
- **FAQ**: 4 вопроса
- **CTA**: "Начните сегодня" + "Увидите, как это работает, за 15 минут"
- **Footer**: AgentCore branding + links

## Техническая реализация

### Stack
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS v3
- Framer Motion (scroll animations, parallax)
- Inter font (Google Fonts)
- Lucide React (icons)

### Performance
- 60fps animations
- will-change: transform для анимированных элементов
- CSS transitions для hover
- Framer Motion useScroll для scroll-triggered
- Lazy loading для изображений
- Static generation (SSG)

### File Structure
```
app/family/page.tsx — основной лендинг
components/family/ — компоненты
  - HeroSection.tsx
  - FeaturesGrid.tsx
  - PhoneMockup.tsx
  - UseCases.tsx
  - Results.tsx
  - Testimonials.tsx
  - FAQ.tsx
  - CTASection.tsx
  - Footer.tsx
```
