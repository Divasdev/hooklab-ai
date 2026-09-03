import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Signing you in...');

  useEffect(() => {
    let isCancelled = false;

    const processAuth = async () => {
      try {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        const code = searchParams.get('code');
        if (code) {
          setStatusMessage('Exchanging auth session...');
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        // Check current session (in case of implicit hash auth)
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (data.session) {
          if (!isCancelled) {
            void navigate('/', { replace: true });
          }
          return;
        }

        // Wait momentarily for onAuthStateChange to handle hash-based tokens if any
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (session && !isCancelled) {
              authListener.subscription.unsubscribe();
              void navigate('/', { replace: true });
            }
          }
        );

        // Safety fallback timer if no session is detected after 4 seconds
        setTimeout(() => {
          if (!isCancelled) {
            authListener.subscription.unsubscribe();
            void navigate('/', { replace: true });
          }
        }, 3500);
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : 'Authentication failed';
          void navigate(`/auth?error=${encodeURIComponent(message)}`, {
            replace: true,
          });
        }
      }
    };

    void processAuth();

    return () => {
      isCancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-bg px-4 text-primary">
      <div className="flex flex-col items-center text-center">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber">
          00:00 HookLab.AI
        </p>

        <div className="my-6 grid h-14 w-14 place-items-center rounded-full border border-amber/30 bg-amber/10 shadow-amber">
          <Loader2
            size={28}
            className="animate-spin text-amber"
            aria-hidden="true"
          />
        </div>

        <h1 className="font-display text-xl font-semibold sm:text-2xl">
          {statusMessage}
        </h1>

        <p className="mt-2 font-mono text-xs tracking-wider text-muted">
          SYNCHRONIZING YOUR HOOK WORKSPACE...
        </p>
      </div>
    </div>
  );
}
