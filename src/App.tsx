import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { WorldMap } from './components/WorldMap';
import { CityScreen } from './components/CityScreen';
import { LevelModal } from './components/LevelModal';
import { BossMissionModal } from './components/BossMissionModal';
import { FestivalWorld } from './components/FestivalWorld';
import { ReviewNotebookModal } from './components/ReviewNotebookModal';
import { StudyPlanModal } from './components/StudyPlanModal';
import { SyllabusCoverageModal } from './components/SyllabusCoverageModal';
import { AchievementsModal } from './components/AchievementsModal';
import { SettingsModal } from './components/SettingsModal';
import { FinalAssessmentModal } from './components/FinalAssessmentModal';
import { getCityById, getLevelById } from './data/citiesData';

const GameMain: React.FC = () => {
  const { 
    progress, 
    activeCityId, 
    setActiveCityId,
    activeLevelId,
    setActiveLevelId,
    activeBossCityId,
    setActiveBossCityId,
    isFestivalOpen,
    setIsFestivalOpen
  } = useGame();

  // Modals state
  const [showNotebook, setShowNotebook] = useState<boolean>(false);
  const [showStudyPlan, setShowStudyPlan] = useState<boolean>(false);
  const [showSyllabus, setShowSyllabus] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showFinalAssessment, setShowFinalAssessment] = useState<boolean>(false);

  const activeCity = activeCityId ? getCityById(activeCityId) : null;
  const activeLevel = (activeCityId && activeLevelId) ? getLevelById(activeCityId, activeLevelId) : null;
  const activeBossCity = activeBossCityId ? getCityById(activeBossCityId) : null;

  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-100 flex flex-col font-sans selection:bg-fiesta-red selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenMap={() => {
          setActiveCityId(null);
          setIsFestivalOpen(false);
        }}
        onOpenNotebook={() => setShowNotebook(true)}
        onOpenStudyPlan={() => setShowStudyPlan(true)}
        onOpenSyllabus={() => setShowSyllabus(true)}
        onOpenAchievements={() => setShowAchievements(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenFestival={() => {
          setIsFestivalOpen(true);
          setActiveCityId(null);
        }}
      />

      {/* Main Screen Router */}
      <main className="grow">
        {isFestivalOpen ? (
          <FestivalWorld
            onBackToMap={() => setIsFestivalOpen(false)}
            onStartFinalAssessment={() => setShowFinalAssessment(true)}
          />
        ) : activeCity ? (
          <CityScreen
            city={activeCity}
            onBackToMap={() => setActiveCityId(null)}
            onOpenLevel={(levelId) => setActiveLevelId(levelId)}
            onOpenBoss={() => setActiveBossCityId(activeCity.id)}
          />
        ) : (
          <WorldMap
            onSelectCity={(cityId) => setActiveCityId(cityId)}
            onOpenFestival={() => setIsFestivalOpen(true)}
          />
        )}
      </main>

      {/* Level Modal */}
      {activeCity && activeLevel && (
        <LevelModal
          level={activeLevel}
          cityId={activeCity.id}
          onClose={() => setActiveLevelId(null)}
          onCompleteLevel={() => setActiveLevelId(null)}
        />
      )}

      {/* Boss Mission Modal */}
      {activeBossCity && (
        <BossMissionModal
          bossMission={activeBossCity.bossMission}
          cityName={activeBossCity.name}
          onClose={() => setActiveBossCityId(null)}
          onSuccess={(unlockedNextCityId) => {
            setActiveBossCityId(null);
            if (unlockedNextCityId) {
              setActiveCityId(unlockedNextCityId);
            }
          }}
        />
      )}

      {/* Spaced Review Mistakes Notebook Modal */}
      {showNotebook && (
        <ReviewNotebookModal onClose={() => setShowNotebook(false)} />
      )}

      {/* 35-Day Study Plan Modal */}
      {showStudyPlan && (
        <StudyPlanModal
          onClose={() => setShowStudyPlan(false)}
          onGoToCity={(cityId) => {
            setActiveCityId(cityId);
            setIsFestivalOpen(false);
          }}
          onGoToFestival={() => {
            setIsFestivalOpen(true);
            setActiveCityId(null);
          }}
        />
      )}

      {/* Syllabus Coverage Modal */}
      {showSyllabus && (
        <SyllabusCoverageModal
          onClose={() => setShowSyllabus(false)}
          onGoToCity={(cityId) => {
            setActiveCityId(cityId);
            setIsFestivalOpen(false);
          }}
        />
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <AchievementsModal onClose={() => setShowAchievements(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Cumulative Final Assessment Modal */}
      {showFinalAssessment && (
        <FinalAssessmentModal onClose={() => setShowFinalAssessment(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0C0E16] py-4 px-6 text-center text-xs text-slate-500">
        <p>
          ¡Aventura Española! • Basado en el sílabo oficial <strong>BAESP101 Spanish Level I</strong> y <strong>Nuevo Español sin Fronteras ESF 1</strong>.
        </p>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <GameProvider>
      <GameMain />
    </GameProvider>
  );
}

export default App;
