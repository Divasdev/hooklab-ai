import { ArrowLeft, Loader2, Mail, Scissors } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

type AuthMode = 'magic-link' | 'password';
type PasswordSubMode = 'signin' | 'signup';

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('magic-link');
  const [passwordSubMode, setPasswordSubMode] =
    useState<PasswordSubMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(() => {
    return searchParams.get('error') || null;
  });
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    // If user is already authenticated, redirect to main editor
    if (user && !authLoading) {
      void navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Invalid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Please enter a password');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleGoogleSignIn = async () => {
    try {
      setGeneralError(null);
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setGeneralError(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to Google OAuth'
      );
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateEmail(email)) {
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setGeneralError(error.message);
      } else {
        setIsMagicLinkSent(true);
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : 'Failed to send magic link'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSignUpSuccessMessage(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setIsLoading(true);
      if (passwordSubMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setPasswordError('Incorrect email or password');
          } else {
            setGeneralError(error.message);
          }
        } else {
          void navigate('/');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            setEmailError('Email already registered — sign in instead?');
          } else {
            setGeneralError(error.message);
          }
        } else if (data.session) {
          void navigate('/');
        } else {
          setSignUpSuccessMessage(
            'Account created! Check your email to confirm your account.'
          );
        }
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : 'Authentication failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isAnyLoading = isLoading || isGoogleLoading;

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center bg-bg px-4 py-8 font-sans text-primary sm:px-6 sm:py-12">
      {/* Top back navigation */}
      <div className="mx-auto mb-6 w-full max-w-[440px]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-amber"
        >
          <ArrowLeft size={14} />
          <span>Back to HookLab</span>
        </Link>
      </div>

      {/* Main Auth Card */}
      <div className="mx-auto w-full max-w-[440px] rounded-[12px] border border-border bg-surface p-5 shadow-panel sm:px-9 sm:py-10">
        {isMagicLinkSent ? (
          /* Confirmation State (after Magic Link sent) */
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-amber/30 bg-amber/10 text-amber shadow-amber">
              <Mail size={36} aria-hidden="true" />
            </div>

            <h2 className="font-display text-2xl font-semibold text-primary sm:text-3xl">
              Check your email
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              We sent a sign-in link to
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-primary">
              {email}
            </p>

            <p className="mt-4 text-sm text-muted">
              Click the link to sign in. <br />
              <span className="text-secondary">No password needed.</span>
            </p>

            <div className="mt-8 border-t border-border pt-5 w-full">
              <button
                type="button"
                onClick={() => {
                  setIsMagicLinkSent(false);
                  setEmailError(null);
                  setGeneralError(null);
                }}
                className="font-mono text-xs uppercase tracking-[0.12em] text-amber transition-colors hover:underline"
              >
                Wrong email? Go back
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header inside the card */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber">
                  00:00 HOOKLAB.AI
                </p>
                <div className="grid h-8 w-8 place-items-center rounded-[4px] border border-amber/20 bg-amber/10 text-amber">
                  <Scissors size={18} aria-hidden="true" />
                </div>
              </div>

              <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-primary sm:text-3xl">
                Sign in to HookLab.AI
              </h1>

              <p className="mt-1.5 text-sm text-muted">
                Save your hooks across all your devices.
              </p>
            </div>

            {generalError && (
              <div
                role="alert"
                className="mb-5 rounded-[6px] border border-accent-error/30 bg-accent-error/10 p-3 font-sans text-xs leading-relaxed text-accent-error"
              >
                {generalError}
              </div>
            )}

            {signUpSuccessMessage && (
              <div
                role="status"
                className="mb-5 rounded-[6px] border border-cyan/30 bg-cyan/10 p-3 font-sans text-xs leading-relaxed text-cyan"
              >
                {signUpSuccessMessage}
              </div>
            )}

            {/* 1. Google OAuth button */}
            <button
              type="button"
              disabled={isAnyLoading}
              onClick={() => void handleGoogleSignIn()}
              className="flex min-h-[46px] w-full items-center justify-center gap-3 rounded-[8px] border border-border bg-surface-elevated px-4 py-2.5 font-sans text-sm font-medium text-primary shadow-sm transition-all hover:border-amber/40 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin text-amber"
                  aria-hidden="true"
                />
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* 2. Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative bg-surface px-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                or
              </div>
            </div>

            {/* 3. Magic Link vs Password Section */}
            {authMode === 'magic-link' ? (
              <form onSubmit={(e) => void handleMagicLinkSubmit(e)} noValidate>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="auth-email-magic"
                      className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted"
                    >
                      Email address
                    </label>
                    <input
                      id="auth-email-magic"
                      type="email"
                      value={email}
                      disabled={isAnyLoading}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="your@email.com"
                      className={`w-full rounded-[6px] border bg-surface-elevated px-3.5 py-2.5 font-mono text-sm text-primary placeholder:text-muted/50 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber disabled:opacity-50 ${
                        emailError ? 'border-accent-error' : 'border-border'
                      }`}
                    />
                    {emailError && (
                      <p className="mt-1.5 text-xs text-accent-error">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isAnyLoading}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-[6px] bg-amber px-4 py-2.5 font-sans text-sm font-semibold text-black transition-all hover:bg-amber/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2
                        size={18}
                        className="animate-spin text-black"
                        aria-hidden="true"
                      />
                    ) : (
                      'Send Magic Link'
                    )}
                  </button>
                </div>

                {/* 4. Toggle to Email + Password */}
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    disabled={isAnyLoading}
                    onClick={() => {
                      setAuthMode('password');
                      setEmailError(null);
                      setPasswordError(null);
                      setGeneralError(null);
                    }}
                    className="font-sans text-xs text-muted transition-colors hover:text-amber"
                  >
                    Prefer a password? Sign in with email →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => void handlePasswordSubmit(e)} noValidate>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="auth-email-pwd"
                      className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted"
                    >
                      Email address
                    </label>
                    <input
                      id="auth-email-pwd"
                      type="email"
                      value={email}
                      disabled={isAnyLoading}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="your@email.com"
                      className={`w-full rounded-[6px] border bg-surface-elevated px-3.5 py-2.5 font-mono text-sm text-primary placeholder:text-muted/50 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber disabled:opacity-50 ${
                        emailError ? 'border-accent-error' : 'border-border'
                      }`}
                    />
                    {emailError && (
                      <p className="mt-1.5 text-xs text-accent-error">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="auth-password"
                        className="font-mono text-xs uppercase tracking-wider text-muted"
                      >
                        Password
                      </label>
                    </div>
                    <input
                      id="auth-password"
                      type="password"
                      value={password}
                      disabled={isAnyLoading}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="••••••••"
                      className={`w-full rounded-[6px] border bg-surface-elevated px-3.5 py-2.5 font-mono text-sm text-primary placeholder:text-muted/50 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber disabled:opacity-50 ${
                        passwordError ? 'border-accent-error' : 'border-border'
                      }`}
                    />
                    {passwordError && (
                      <p className="mt-1.5 text-xs text-accent-error">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isAnyLoading}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-[6px] bg-amber px-4 py-2.5 font-sans text-sm font-semibold text-black transition-all hover:bg-amber/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2
                        size={18}
                        className="animate-spin text-black"
                        aria-hidden="true"
                      />
                    ) : passwordSubMode === 'signin' ? (
                      'Sign In'
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={isAnyLoading}
                    onClick={() => {
                      setPasswordSubMode((prev) =>
                        prev === 'signin' ? 'signup' : 'signin'
                      );
                      setPasswordError(null);
                    }}
                    className="font-sans text-xs text-secondary hover:text-amber"
                  >
                    {passwordSubMode === 'signin'
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>

                  <button
                    type="button"
                    disabled={isAnyLoading}
                    onClick={() => {
                      setAuthMode('magic-link');
                      setEmailError(null);
                      setPasswordError(null);
                      setGeneralError(null);
                    }}
                    className="font-mono text-xs text-muted transition-colors hover:text-amber"
                  >
                    ← Use magic link instead
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer copyright / info */}
      <div className="mx-auto mt-6 text-center">
        <p className="font-mono text-[11px] text-muted">
          HookLab.AI &bull; Soft Authentication &bull; Private & Secure
        </p>
      </div>
    </div>
  );
}
