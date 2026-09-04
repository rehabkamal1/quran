
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Quran } from './pages/Quran';
import { QuranReader } from './pages/QuranReader';
import { JuzView } from './pages/JuzView';
import { Adhkar } from './pages/Adhkar';
import { AdhkarReader } from './pages/AdhkarReader';
import { Tasbih } from './pages/Tasbih';
import { Prayer } from './pages/Prayer';
import { Settings } from './pages/Settings';
import { Hadith } from './pages/Hadith';
import { Stories } from './pages/Stories';
import { Qibla } from './pages/Qibla';
import { Khatmah } from './pages/Khatmah';
import { Duas } from './pages/Duas';
import { Ruqyah } from './pages/Ruqyah';
import { Radio } from './pages/Radio';
import { About } from './pages/About';

import { AdhanProvider } from './context/AdhanContext';
import { GlobalPlayerProvider } from './context/GlobalPlayerContext';

function App() {
  return (
    <BrowserRouter>
      <GlobalPlayerProvider>
        <AdhanProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="quran" element={<Quran />} />
              <Route path="quran/read/:surahId" element={<QuranReader />} />
              <Route path="quran/juz/:juzId" element={<JuzView />} />
              <Route path="adhkar" element={<Adhkar />} />
              <Route path="adhkar/:categoryId" element={<AdhkarReader />} />
              <Route path="hadith" element={<Hadith />} />
              <Route path="stories" element={<Stories />} />
              <Route path="duas" element={<Duas />} />
              <Route path="ruqyah" element={<Ruqyah />} />
              <Route path="radio" element={<Radio />} />
              <Route path="tasbih" element={<Tasbih />} />
              <Route path="prayer" element={<Prayer />} />
              <Route path="qibla" element={<Qibla />} />
              <Route path="khatmah" element={<Khatmah />} />
              <Route path="about" element={<About />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          <Analytics />
        </AdhanProvider>
      </GlobalPlayerProvider>
    </BrowserRouter>
  );
}

export default App;
