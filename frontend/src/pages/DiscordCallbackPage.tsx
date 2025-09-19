import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Box, Text, Card, Spinner } from '@radix-ui/themes';
import { useDiscord } from '../hooks/useDiscord';
import { scrollToTop } from '../hooks/useScrollToTop';

export function DiscordCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback } = useDiscord();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(`Discord authentication error: ${error}`);
        setTimeout(() => {
          scrollToTop();
          navigate('/');
        }, 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing authentication parameters');
        setTimeout(() => {
          scrollToTop();
          navigate('/');
        }, 3000);
        return;
      }

      try {
        await handleCallback(code, state);
        setStatus('success');

        // Get the page user was on before Discord login (stored in localStorage by Discord service)
        const returnUrl = localStorage.getItem('discord_return_url') || '/';
        localStorage.removeItem('discord_return_url');

        setTimeout(() => {
          scrollToTop();
          navigate(returnUrl);
        }, 1000);
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        setTimeout(() => {
          scrollToTop();
          navigate('/');
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center" as const,
    maxWidth: "400px",
    margin: "0 auto"
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{
        minHeight: "60vh",
        padding: "24px"
      }}
    >
      <Card style={cardStyle}>
        {status === 'processing' && (
          <>
            <Spinner size="3" style={{ marginBottom: "16px" }} />
            <Text size="4" style={{ color: "white", marginBottom: "8px" }}>
              Connecting to Discord...
            </Text>
            <Text size="2" color="gray">
              Please wait while we authenticate your Discord account
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text size="6" style={{ marginBottom: "16px" }}>✅</Text>
            <Text size="4" style={{ color: "white", marginBottom: "8px" }}>
              Discord Connected Successfully!
            </Text>
            <Text size="2" color="gray">
              Taking you back where you left off...
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text size="6" style={{ marginBottom: "16px" }}>❌</Text>
            <Text size="4" style={{ color: "white", marginBottom: "8px" }}>
              Authentication Failed
            </Text>
            <Text size="2" color="gray" style={{ marginBottom: "16px" }}>
              {errorMessage}
            </Text>
            <Text size="2" color="gray">
              Redirecting you back to home...
            </Text>
          </>
        )}
      </Card>
    </Flex>
  );
}