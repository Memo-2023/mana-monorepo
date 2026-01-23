/**
 * @manacore/shared-landing-ui
 *
 * Shared Astro components for landing pages across the Manacore monorepo.
 *
 * Usage:
 * Import components directly from their paths:
 *
 * ```astro
 * ---
 * // Atoms
 * import Button from '@manacore/shared-landing-ui/atoms/Button.astro';
 * import Badge from '@manacore/shared-landing-ui/atoms/Badge.astro';
 * import Card from '@manacore/shared-landing-ui/atoms/Card.astro';
 * import Container from '@manacore/shared-landing-ui/atoms/Container.astro';
 * import SectionHeader from '@manacore/shared-landing-ui/atoms/SectionHeader.astro';
 * import GradientText from '@manacore/shared-landing-ui/atoms/GradientText.astro';
 * import LanguageSwitcher from '@manacore/shared-landing-ui/atoms/LanguageSwitcher.astro';
 *
 * // Sections
 * import HeroSection from '@manacore/shared-landing-ui/sections/HeroSection.astro';
 * import FeatureSection from '@manacore/shared-landing-ui/sections/FeatureSection.astro';
 * import PricingSection from '@manacore/shared-landing-ui/sections/PricingSection.astro';
 * import FAQSection from '@manacore/shared-landing-ui/sections/FAQSection.astro';
 * import CTASection from '@manacore/shared-landing-ui/sections/CTASection.astro';
 * import TestimonialSection from '@manacore/shared-landing-ui/sections/TestimonialSection.astro';
 * import StepsSection from '@manacore/shared-landing-ui/sections/StepsSection.astro';
 * import AppScrollerSection from '@manacore/shared-landing-ui/sections/AppScrollerSection.astro';
 * import TimelineSection from '@manacore/shared-landing-ui/sections/TimelineSection.astro';
 * import MasonryGridSection from '@manacore/shared-landing-ui/sections/MasonryGridSection.astro';
 * import PrinciplesSection from '@manacore/shared-landing-ui/sections/PrinciplesSection.astro';
 * import ManaPricingSection from '@manacore/shared-landing-ui/sections/ManaPricingSection.astro';
 *
 * // Data
 * import { pricingPlans, defaultPricingTranslations, englishPricingTranslations } from '@manacore/shared-landing-ui/data/pricing';
 *
 * // Layouts
 * import Footer from '@manacore/shared-landing-ui/layouts/Footer.astro';
 * import Navigation from '@manacore/shared-landing-ui/layouts/Navigation.astro';
 *
 * // Templates
 * import LegalPageTemplate from '@manacore/shared-landing-ui/templates/LegalPageTemplate.astro';
 *
 * // i18n
 * import { getLangFromUrl, useTranslations, localizePath } from '@manacore/shared-landing-ui/i18n';
 *
 * // Themes (import as CSS)
 * import '@manacore/shared-landing-ui/themes';
 * import '@manacore/shared-landing-ui/themes/manacore';
 * import '@manacore/shared-landing-ui/themes/picture';
 * ---
 * ```
 *
 * Components require CSS custom properties to be defined in your project.
 * See utils/index.ts for the required variables and example themes.
 */

export * from './utils/index';
export * from './i18n/index';
export * from './data/pricing';
