# Flow Definition: DD Box Printing
## Business Overview
- **Business Name:** DD Box Printing
- **Core Value Proposition:** High-quality, affordable custom packaging, premium cosmetic boxes, and 3-ply corrugated boxes with fast turnaround times in Thailand.
- **Goal:** Transform a traditional printing factory website into a modern, Packlane-inspired e-commerce storefront. The focus is on easy product discovery, building trust, and generating high-quality leads through a "Request a Quote" or "Instant Quote" pipeline.
- **Target Audience:** B2B e-commerce owners, SME brands, and corporate procurement teams.

## Key User Journeys
1. **Discovery & Inspiration:** User lands on the Home page -> sees premium box examples -> browses the Portfolio/Gallery to build trust.
2. **Product Selection & Quoting (The Packlane Model):** User selects a box category (e.g., Cosmetic Box) -> navigates to the Product Page -> configures dimensions, material, and quantity -> clicks "Request Quote" or views estimated price.
3. **Direct Contact (Local B2B):** User wants to talk to a human -> navigates to Contact/Footer -> clicks to Call or Add LINE.

## Sitemap
1. **Home Page (`/`)**: Main entry point, value proposition, category portal, and trust signals.
2. **Product Listing / Categories (`/products`)**: Overview of all box types.
3. **Product Detail Page - PDP (`/products/[box-type]`)**: Detailed spec, Packlane-style configuration form, and CTA.
4. **Inspiration Gallery (`/gallery`)**: Visual proof of past works.
5. **Contact Us (`/contact`)**: Factory location, business hours, and direct communication links.

## Page Specifications

### 1. Home Page
- **Header:** Logo (left), Navigation Links (Products, Gallery, Contact), Primary CTA button ("ขอใบเสนอราคา / Get a Quote").
- **Hero Section:** 
  - Clear H1 highlighting "Premium Custom Boxes".
  - Packlane-style bold layout with a high-quality 3D/Photo mockup of boxes.
  - Primary CTA: "Browse Box Types".
- **Category Grid:** 3 main cards (Cosmetic Box, Corrugated Box, Custom Die-cut). Each card needs a photo, brief description, and a secondary CTA ("Configure this box").
- **How It Works (Workflow):** 3-4 simple steps (Select Box -> Customize Size -> Get Quote -> Receive Delivery).
- **Trust Section:** Factory capabilities (Eco-friendly, Direct Factory, Fast Delivery) + Client logos.
- **Footer:** SEO-friendly local address (Samut Prakan), Contact info, Business hours.

### 2. Product Detail Page (PDP)
*Note: This page should heavily mimic the Packlane configuration experience.*
- **Left Column (Visual):** Large product image gallery or 3D box preview placeholder.
- **Right Column (Configuration Form):**
  - Product Title (H1) and short description.
  - Input fields for Dimensions (Length, Width, Depth).
  - Dropdown for Material type (e.g., Premium Cardboard, Kraft, Corrugated).
  - Dropdown/Input for Quantity (Minimum Order Quantity rules apply).
  - **Action Area:** Estimated Price display (or "Calculation pending") and a massive Primary CTA button: "Request Custom Quote".

### 3. Inspiration Gallery Page
- **Header:** "Our Previous Work".
- **Filter Tabs:** All, Cosmetics, Food, E-commerce shipping.
- **Masonry Grid:** High-quality images of manufactured boxes. Clicking an image opens a modal with details and a button "Make a box like this".

### 4. Contact & Factory Info Page
- **Layout:** Split layout.
- **Left:** Contact form (Name, Email, Phone, Project Details, File Upload for AI/PDF designs).
- **Right:** Google Maps integration, Full Factory Address, Clickable Phone Number (`tel:`), Clickable Email (`mailto:`), and LINE OA QR Code.

## Functional & Interaction Rules
- **Navigation:** Must be sticky at the top so users can "Get a Quote" from anywhere.
- **Forms:** Input fields must have clear labels and placeholder text (e.g., "Enter length in cm").
- **Mobile Experience:** The configuration form on the PDP must stack cleanly under the product image on mobile devices.
- **CTAs:** Never use generic labels like "Submit". Use action-oriented labels like "Get My Quote", "Configure Box", or "View Gallery".
