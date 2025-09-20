import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { HermitFinancePage } from "./pages/HermitFinancePage";
import { HumpbackLaunchpadPage } from "./pages/HumpbackLaunchpadPage";
import { SplashZonePage } from "./pages/SplashZonePage";
import { DiscordCallbackPage } from "./pages/DiscordCallbackPage";
import BoardGameLaunchpadPage from "./pages/BoardGameLaunchpadPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="hermit-finance" element={<HermitFinancePage />} />
          <Route path="humpback-launchpad" element={<HumpbackLaunchpadPage />} />
          <Route path="board-game-launchpad" element={<BoardGameLaunchpadPage />} />
          <Route path="splash-zone" element={<SplashZonePage />} />
          <Route path="auth/discord/callback" element={<DiscordCallbackPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
