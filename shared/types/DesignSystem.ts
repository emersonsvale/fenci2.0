/**
 * Design System Types - Fenci
 * Tipos TypeScript para garantir consistência no uso do design system
 */

// ============================================
// CORES
// ============================================
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

export type PrimaryColor = `primary-${ColorShade}` | 'primary'

export type SemanticColor = 'success' | 'warning' | 'error' | 'info'

export type SurfaceColor = 
  | 'surface-light' 
  | 'surface-light-secondary' 
  | 'surface-light-tertiary'
  | 'surface-dark'
  | 'surface-dark-secondary'
  | 'surface-dark-tertiary'

export type ContentColor =
  | 'content-primary'
  | 'content-secondary'
  | 'content-tertiary'
  | 'content-primary-dark'
  | 'content-secondary-dark'
  | 'content-tertiary-dark'

// ============================================
// TIPOGRAFIA
// ============================================
export type DisplaySize = 'display-lg' | 'display-md' | 'display-sm'

export type HeadingSize = 'heading-xl' | 'heading-lg' | 'heading-md' | 'heading-sm'

export type BodySize = 'body-lg' | 'body-md' | 'body-sm'

export type TextSize = DisplaySize | HeadingSize | BodySize | 'caption' | 'label'

export type FontWeight = 400 | 500 | 600 | 700 | 800

// ============================================
// ESPAÇAMENTOS
// ============================================
export type SpacingScale = 
  | 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 | 6 | 7 | 8 
  | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 18 | 20 | 22 | 24 | 26 | 28 | 30 | 32

// ============================================
// BORDER RADIUS
// ============================================
export type BorderRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'

// ============================================
// SOMBRAS
// ============================================
export type BoxShadow = 
  | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  | 'primary' | 'primary-lg'
  | 'card' | 'card-hover'

// ============================================
// Z-INDEX
// ============================================
export type ZIndex = 'dropdown' | 'sticky' | 'overlay' | 'modal' | 'popover' | 'tooltip' | 'toast'

// ============================================
// COMPONENTES
// ============================================

// Botões
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  iconOnly?: boolean
}

// Inputs
export type InputVariant = 'default' | 'error' | 'success'
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps {
  variant?: InputVariant
  size?: InputSize
  disabled?: boolean
  required?: boolean
  placeholder?: string
  helperText?: string
  errorMessage?: string
}

// Badges
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

// Avatars
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  size?: AvatarSize
  src?: string
  alt?: string
  initials?: string
}

// Cards
export type CardVariant = 'default' | 'hover' | 'interactive'

export interface CardProps {
  variant?: CardVariant
  padding?: SpacingScale
}

// ============================================
// ANIMAÇÕES
// ============================================
export type Animation = 
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'scale-in'
  | 'slide-in-right'
  | 'slide-in-left'
  | 'pulse-soft'
  | 'spin-slow'

// ============================================
// BREAKPOINTS
// ============================================
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export const breakpoints: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}
