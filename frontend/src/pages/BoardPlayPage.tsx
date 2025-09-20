import { useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

export default function GamePlayPage({ gameId }: { gameId: string }) {
  const client = useSuiClient();
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    async function fetchGame() {
      try {
        const game = await client.getObject({
          id: gameId,
          options: { showContent: true },
        });
        setGameState(game.data?.content?.fields);
      } catch (err) {
        console.error('Failed to fetch game', err);
      }
    }
    fetchGame();
  }, [gameId]);

  if (!gameState) return <p>Loading game...</p>;

  return (
    <div style={{ padding: '16px' }}>
      <h1>Game Play</h1>
      <p>Players: {JSON.stringify(gameState.players)}</p>
      {/* TODO: 보드 렌더링, 말 위치, 주사위 버튼 등 추가 */}
    </div>
  );
}
