import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { HermitFinancePage } from "./pages/HermitFinancePage";
import { HumpbackLaunchpadPage } from "./pages/HumpbackLaunchpadPage";
import { SplashZonePage } from "./pages/SplashZonePage";
import { DiscordCallbackPage } from "./pages/DiscordCallbackPage";
import BoardGameLaunchpadPage from "./pages/BoardGameLaunchpadPage";
import { CardGameLaunchpadPage } from "./pages/CardGameLaunchpadPage";
import { CardGamePage } from "./pages/CardGamePage";
import { BoardGameLobbyPage } from "./pages/BoardGameLobbyPage";
import { BoardGamePage } from "./pages/BoardGamePage";
import { BoardPlayPage } from "./pages/BoardPlayPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="hermit-finance" element={<HermitFinancePage />} />
          <Route path="humpback-launchpad" element={<HumpbackLaunchpadPage />} />
          <Route path="board-game-launchpad" element={<BoardGameLaunchpadPage />} />
          <Route path="card-game-launchpad" element={<CardGameLaunchpadPage />} />
          <Route path="card-game/:instanceId" element={<CardGamePage />} />
          <Route path="board-game-lobby/:instanceId" element={<BoardGameLobbyPage />} />
          <Route path="board-game/:instanceId" element={<BoardGamePage />} />
          <Route path="board-play/:instanceId" element={<BoardPlayPage />} />
          <Route path="splash-zone" element={<SplashZonePage />} />
          <Route path="auth/discord/callback" element={<DiscordCallbackPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
