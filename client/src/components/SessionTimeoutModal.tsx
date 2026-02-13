import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SessionTimeoutModalProps {
  open: boolean;
  remainingTime: number;
  onContinue: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  open,
  remainingTime,
  onContinue,
  onLogout,
}: SessionTimeoutModalProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (open && remainingTime > 0) {
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }
  }, [open, remainingTime]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You've been inactive for a while. For your security, your session will expire soon.
            </p>
            <p className="text-lg font-semibold text-foreground">
              Time remaining: {timeLeft}
            </p>
            <p className="text-sm">
              Click "Stay Logged In" to continue your session, or you'll be automatically logged out.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={onLogout}
          >
            Log Out Now
          </Button>
          <AlertDialogAction onClick={onContinue}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
