/**
 * @mana/shared-landing-ui
 *
 * Shared Astro components for landing pages across the Mana monorepo.
 *
 * Usage:
 * Import components directly from their paths:
 *
 * ```astro
 * ---
 * // Atoms
 * import Button from '@mana/shared-landing-ui/atoms/Button.astro';
 * import Badge from '@mana/shared-landing-ui/atoms/Badge.astro';
 * import Card from '@mana/shared-landing-ui/atoms/Card.astro';
 * import Container from '@mana/shared-landing-ui/atoms/Container.astro';
 * import SectionHeader from '@mana/shared-landing-ui/atoms/SectionHeader.astro';
 * import GradientText from '@mana/shared-landing-ui/atoms/GradientText.astro';
 * import LanguageSwitcher from '@mana/shared-landing-ui/atoms/LanguageSwitcher.astro';
 *
 * // Sections
 * import HeroSection from '@mana/shared-landing-ui/sections/HeroSection.astro';
 * import FeatureSection from '@mana/shared-landing-ui/sections/FeatureSection.astro';
 * import PricingSection from '@mana/shared-landing-ui/sections/PricingSection.astro';
 * import FAQSection from '@mana/shared-landing-ui/sections/FAQSection.astro';
 * import CTASection from '@mana/shared-landing-ui/sections/CTASection.astro';
 * import TestimonialSection from '@mana/shared-landing-ui/sections/TestimonialSection.astro';
 * import StepsSection from '@mana/shared-landing-ui/sections/StepsSection.astro';
 * import AppScrollerSection from '@mana/shared-landing-ui/sections/AppScrollerSection.astro';
 * import TimelineSection from '@mana/shared-landing-ui/sections/TimelineSection.astro';
 * import MasonryGridSection from '@mana/shared-landing-ui/sections/MasonryGridSection.astro';
 * import PrinciplesSection from '@mana/shared-landing-ui/sections/PrinciplesSection.astro';
 * import ManaPricingSection from '@mana/shared-landing-ui/sections/ManaPricingSection.astro';
 *
 * // Data
 * import { pricingPlans, defaultPricingTranslations, englishPricingTranslations } from '@mana/shared-landing-ui/data/pricing';
 *
 * // Layouts
 * import Footer from '@mana/shared-landing-ui/layouts/Footer.astro';
 * import Navigation from '@mana/shared-landing-ui/layouts/Navigation.astro';
 *
 * // Templates
 * import LegalPageTemplate from '@mana/shared-landing-ui/templates/LegalPageTemplate.astro';
 *
 * // i18n
 * import { getLangFromUrl, useTranslations, localizePath } from '@mana/shared-landing-ui/i18n';
 *
 * // Themes (import as CSS)
 * import '@mana/shared-landing-ui/themes';
 * import '@mana/shared-landing-ui/themes/mana';
 * import '@mana/shared-landing-ui/themes/picture';
 * ---
 * ```
 *
 * Components require CSS custom properties to be defined in your project.
 * See utils/index.ts for the required variables and example themes.
 */

export * from './utils/index';
export * from './i18n/index';
export * from './data/pricing';
