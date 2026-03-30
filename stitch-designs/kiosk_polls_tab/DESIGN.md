# Design System Strategy: The Culinary Lume

## 1. Overview & Creative North Star: "The Midnight Concierge"
This design system is built to transcend the utility of a standard food app, moving into the realm of a high-end, late-night editorial experience. Our Creative North Star is **"The Midnight Concierge."** 

We reject the "flat" aesthetic of modern utility apps. Instead, we embrace **Chromatic Depth**—where the UI feels like a series of glowing, glass-like layers suspended in a deep, infinite void. By utilizing intentional asymmetry, oversized "Display" typography, and the absence of structural lines, we create an interface that feels curated, immersive, and premium. The goal is to make the user feel like they are flipping through a luxury food magazine under neon lights, rather than scrolling a database.

---

## 2. Color & Surface Architecture
The palette is rooted in high-contrast drama. We utilize a "Super-Black" foundation to let the vibrant orange accents and glass elements "pop" with an almost emissive quality.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be achieved through:
1.  **Background Shifts:** Placing a `surface_container_low` card against a `surface` background.
2.  **Negative Space:** Using the Spacing Scale (specifically `8` to `12`) to create mental groupings.
3.  **Tonal Transitions:** Using subtle gradients to guide the eye.

### Surface Hierarchy & Nesting
Treat the UI as physical layers. Each step up in the hierarchy moves "closer" to the user by getting slightly lighter or more transparent:
*   **Base:** `surface` (#131313) or `surface_container_lowest` (#0E0E0E) for the deepest background.
*   **The Container:** Use `surface_container` (#201F1F) for primary content areas.
*   **The Hero:** Use `surface_bright` (#3A3939) at 40% opacity with a `backdrop-blur` of 20px to create the signature glass look.

### The "Glass & Glow" Rule
To achieve the requested "Border Glow," use a `px` width stroke with a linear gradient. The gradient should run from `primary` (#FFB77D) at 30% opacity to `primary_container` (#FF8C00) at 0%. This creates a "light-leak" effect on the edges of cards, suggesting they are illuminated from within.

---

## 3. Typography: Editorial Authority
We use **Plus Jakarta Sans** for its geometric clarity and modern "ink traps," which maintain legibility even on glowing dark backgrounds.

*   **The Power Scale:** Use `display-lg` (3.5rem) for dish names or "Hero" discovery moments. Let the text bleed slightly off-center to create intentional asymmetry.
*   **Visual Hierarchy:** 
    *   **Headlines:** `headline-lg` should always be "Bold" (700 weight) to provide a firm anchor for the eye.
    *   **Body:** Use `body-md` for descriptions. Ensure a line-height of at least 1.5 to prevent "text-clumping" in dark mode.
    *   **Micro-Copy:** `label-sm` should be tracked out (+5% letter spacing) to ensure readability against the deep background.

---

## 4. Elevation & Depth
In this design system, shadows are not "darkness"—they are **Ambient Occlusion.**

*   **Tonal Layering:** Depth is achieved by "stacking." A `surface_container_highest` (#353534) element sitting on a `surface_dim` (#131313) base creates enough contrast that a shadow is often redundant.
*   **The "Ghost Border" Fallback:** If a container needs more definition (e.g., a modal), use the `outline_variant` (#564334) at **15% opacity**. This provides a whisper of a boundary without breaking the immersive dark feel.
*   **The Lume Shadow:** When a floating action button (FAB) or glass card is used, the shadow must be tinted. Use `primary_container` at 8% opacity with a blur of `xl` (1.5rem). This mimics the way a warm orange light would cast a glow on a dark table.

---

## 5. Components & Signature Patterns

### Buttons (The "Core Interaction")
*   **Primary:** Solid `primary_container` (#FF8C00). Roundedness: `full`. No border.
*   **Secondary (Glass):** Background: `surface_bright` at 10% opacity + `backdrop-blur` (12px). Stroke: `outline_variant` at 20% opacity.
*   **Interaction:** On hover/active, apply a 2px inner-glow using `primary_fixed` to simulate a button being pressed into a light source.

### Food Cards (The "Discovery" Engine)
*   **Structure:** No dividers. Use `surface_container_low` for the card base. 
*   **Glass Overlay:** The price and "distance" tags should be glassmorphic chips (`surface_bright` @ 20% + blur) floating in the corner of the food image.
*   **Roundedness:** All cards must use `xl` (1.5rem) corners to soften the "Brutalist" dark background.

### Input Fields
*   **Style:** Minimalist. No bottom line. Use `surface_container_highest` as a subtle block background. 
*   **Active State:** The border glow effect (from section 2) triggers only on focus, signaling "system life."

### The "Flavor Map" (Custom Component)
A full-bleed map interface where the markers aren't pins, but glowing pulses of `primary`. When selected, the marker expands into a glassmorphic "Mini-Card" showing the dish.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place high-end food photography slightly off-canvas or overlapping two containers to break the "grid" feel.
*   **Embrace Negative Space:** If in doubt, add more space. Deep dark backgrounds require more "breathing room" to avoid feeling claustrophobic.
*   **Layer Glass:** Use stacking—a glass chip on top of a glass card on top of a dark background—to create a sense of true physical depth.

### Don't:
*   **No Grey Grids:** Never use #CCCCCC or standard grey lines. If you need a divider, use a 12px vertical gap or a change from `surface_container` to `surface`.
*   **No 100% White:** Avoid `#FFFFFF` for large blocks of text. Use `on_surface` (#E5E2E1) to reduce eye strain and maintain the "premium" feel.
*   **No Harsh Shadows:** Never use black (#000000) shadows. They disappear on our dark background and look muddy. Use the tinted "Lume Shadow" instead.

---

## 7. Spacing & Rhythm
*   **The "8-Point" Core:** All padding and margins must follow the Spacing Scale.
*   **Rhythmic Gaps:** Use `12` (3rem) for major section breaks and `4` (1rem) for internal card padding. This high-contrast spacing reinforces the editorial "magazine" layout.