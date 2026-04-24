import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface AiFillButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export function AiFillButton({ onClick, isLoading, disabled }: AiFillButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="gap-2 border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      {isLoading ? 'Analyzing...' : 'Fill with AI'}
    </Button>
  );
}