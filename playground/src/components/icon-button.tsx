import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'size'> & { label: string };

/** Icon-only button with a tooltip and an accessible name. */
export const IconButton = ({ label, variant = 'ghost', ...props }: IconButtonProps) => (
  <Tooltip>
    <TooltipTrigger render={<Button variant={variant} size="icon" aria-label={label} {...props} />} />
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);
