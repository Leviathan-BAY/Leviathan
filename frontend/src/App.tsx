import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { HermitFinancePage } from "./pages/HermitFinancePage";
import { HumpbackLaunchpadPage } from "./pages/HumpbackLaunchpadPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="hermit-finance" element={<HermitFinancePage />} />
          <Route path="humpback-launchpad" element={<HumpbackLaunchpadPage />} />
          {/* TODO: Add SplashZonePage */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
