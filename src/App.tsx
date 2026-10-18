import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { AuthScreen } from './components/AuthScreen';
import { TutorialScreen } from './components/TutorialScreen';
import { Navbar } from './components/Navbar';
import { WorldMap } from './components/WorldMap';
import { CityScreen } from './components/CityScreen';
import { LevelModal } from './components/LevelModal';
import { BossMissionModal } from './components/BossMissionModal';
import { CityUnlockModal } from './components/CityUnlockModal';
import { FestivalWorld } from './components/FestivalWorld';
import { ReviewNotebookModal } from './components/ReviewNotebookModal';
import { StudyPlanModal } from './components/StudyPlanModal';
import { SyllabusCoverageModal } from './components/SyllabusCoverageModal';
import { AchievementsModal } from './components/AchievementsModal';
import { SettingsModal } from './components/SettingsModal';
import { FinalAssessmentModal } from './components/FinalAssessmentModal';
import { JourneyHub } from './components/JourneyHub';
import { OutOfLivesModal } from './components/OutOfLivesModal';
import { getCityById, getLevelById, ALL_CITIES } from './data/citiesData';

const GameMain: React.FC = () => {
  const { 
    progress, 
    currentScreen,
    setCurrentScreen,
    currentUserEmail,
    activeCityId, 
    setActiveCityId,
    activeLevelId,
    setActiveLevelId,
    activeBossCityId,
    setActiveBossCityId,
    isFestivalOpen,
    setIsFestivalOpen,
    completeOnboarding
  } = useGame();

  // Modals state
  const [showNotebook, setShowNotebook] = useState<boolean>(false);
  const [showStudyPlan, setShowStudyPlan] = useState<boolean>(false);
  const [showSyllabus, setShowSyllabus] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showFinalAssessment, setShowFinalAssessment] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showOutOfLivesModal, setShowOutOfLivesModal] = useState<boolean>(false);

  // Home view mode: editorial Journey Hub or Spain World Map
  const [homeViewMode, setHomeViewMode] = useState<'journey-hub' | 'world-map'>('journey-hub');

  // City unlock celebration state
  const [unlockedCityInfo, setUnlockedCityInfo] = useState<{
    completedCityName: string;
    nextCityId?: string;
  } | null>(null);

  // Auth screen mode: login, register, or forgot-password
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  const activeCity = activeCityId ? getCityById(activeCityId) : null;
  const activeLevel = (activeCityId && activeLevelId) ? getLevelById(activeCityId, activeLevelId) : null;
  const activeBossCity = activeBossCityId ? getCityById(activeBossCityId) : null;

  /* ========================================================
     SCREEN 1: AUTH SCREEN (LOGIN / REGISTER / FORGOT PASSWORD)
     Enforces Login Page as 1st page if not logged in
     ======================================================== */
  if (currentScreen === 'auth' || !currentUserEmail) {
    return (
      <AuthScreen
        mode={authMode}
        onSwitchMode={(newMode) => setAuthMode(newMode)}
      />
    );
  }

  /* ========================================================
     SCREEN 2: WELCOME & CHARACTER CREATOR REDIRECT
     Bypasses personalization so players go straight to progress
     ======================================================== */
  if (currentScreen === 'welcome' || currentScreen === 'character-creator') {
    setCurrentScreen('world-map');
    return null;
  }

  /* ========================================================
     SCREEN 3: INTERACTIVE TUTORIAL SCREEN
     ======================================================== */
  if (currentScreen === 'tutorial') {
    return (
      <TutorialScreen
        onComplete={() => {
          completeOnboarding();
          setCurrentScreen('world-map');
        }}
        onSkip={() => {
          completeOnboarding();
          setCurrentScreen('world-map');
        }}
      />
    );
  }

  /* ========================================================
     MAIN ADVENTURE APP SHELL (WORLD MAP / CITY / FESTIVAL)
     Where logged in clients resume their progress
     ======================================================== */
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#24140E] flex flex-col font-sans selection:bg-[#E05615] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenHub={() => {
          setActiveCityId(null);
          setIsFestivalOpen(false);
          setHomeViewMode('journey-hub');
        }}
        onOpenMap={() => {
          setActiveCityId(null);
          setIsFestivalOpen(false);
          setHomeViewMode('world-map');
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
        onOpenLivesModal={() => setShowOutOfLivesModal(true)}
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
            onOpenLevel={(levelId) => {
              if ((progress.stats.lives ?? 3) <= 0) {
                setShowOutOfLivesModal(true);
                return;
              }
              const lvlIdx = activeCity.levels.findIndex(l => l.id === levelId);
              if (lvlIdx > 0) {
                const prevLevel = activeCity.levels[lvlIdx - 1];
                if (!progress.completedLevels[prevLevel.id]) {
                  return; // Cannot unlock next level before completing smaller level!
                }
              }
              setActiveLevelId(levelId);
            }}
            onOpenBoss={() => setActiveBossCityId(activeCity.id)}
          />
        ) : homeViewMode === 'world-map' ? (
          <div className="flex flex-col">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2 w-full flex items-center justify-between">
              <button
                onClick={() => setHomeViewMode('journey-hub')}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] border border-[#E0D5C7] text-[#24140E] font-bold text-xs sm:text-sm shadow-xs flex items-center space-x-1.5 transition-all hover:scale-105 cursor-pointer"
              >
                <span>← Volver a Inicio (Journey Hub)</span>
              </button>
            </div>
            <WorldMap
              onSelectCity={(cityId) => setActiveCityId(cityId)}
              onOpenFestival={() => setIsFestivalOpen(true)}
            />
          </div>
        ) : (
          <JourneyHub
            onStartJourney={() => {
              if ((progress.stats.lives ?? 3) <= 0) {
                setShowOutOfLivesModal(true);
                return;
              }
              const firstCity = ALL_CITIES[0];
              const unfinished = firstCity.levels.find(l => !progress.completedLevels[l.id]) || firstCity.levels[0];
              const unfinishedIdx = firstCity.levels.findIndex(l => l.id === unfinished.id);
              if (unfinishedIdx > 0 && !progress.completedLevels[firstCity.levels[unfinishedIdx - 1].id]) {
                return;
              }
              setActiveCityId(firstCity.id);
              setActiveLevelId(unfinished.id);
            }}
            onOpenMap={() => setHomeViewMode('world-map')}
            onSelectCityPath={(cityId) => {
              if (progress.unlockedCityIds.includes(cityId)) {
                setActiveCityId(cityId);
              }
            }}
            onPlayLevel={(cityId, levelId) => {
              if ((progress.stats.lives ?? 3) <= 0) {
                setShowOutOfLivesModal(true);
                return;
              }
              if (progress.unlockedCityIds.includes(cityId)) {
                const targetCity = getCityById(cityId);
                if (targetCity) {
                  const lvlIdx = targetCity.levels.findIndex(l => l.id === levelId);
                  if (lvlIdx > 0) {
                    const prevLevel = targetCity.levels[lvlIdx - 1];
                    if (!progress.completedLevels[prevLevel.id]) {
                      return; // Cannot unlock next level before completing smaller level!
                    }
                  }
                }
                setActiveCityId(cityId);
                setActiveLevelId(levelId);
              }
            }}
            onOpenFestival={() => {
              setIsFestivalOpen(true);
              setActiveCityId(null);
            }}
            onOpenNotebook={() => setShowNotebook(true)}
            onOpenStudyPlan={() => setShowStudyPlan(true)}
            onOpenSyllabus={() => setShowSyllabus(true)}
            onOpenAchievements={() => setShowAchievements(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </main>

      {/* Level Modal (Question Engine) */}
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
            const completedName = activeBossCity.name;
            setActiveBossCityId(null);
            // Open City Unlock celebration screen!
            setUnlockedCityInfo({
              completedCityName: completedName,
              nextCityId: unlockedNextCityId
            });
          }}
        />
      )}

      {/* City Unlock Celebration Modal */}
      {unlockedCityInfo && (
        <CityUnlockModal
          completedCityName={unlockedCityInfo.completedCityName}
          nextCityId={unlockedCityInfo.nextCityId}
          onContinue={() => {
            const nextId = unlockedCityInfo.nextCityId;
            setUnlockedCityInfo(null);
            if (nextId) {
              setActiveCityId(nextId);
            } else {
              setActiveCityId(null);
            }
          }}
        />
      )}

      {/* Replayable Tutorial Modal (from Settings) */}
      {showTutorialModal && (
        <TutorialScreen
          onComplete={() => setShowTutorialModal(false)}
          onSkip={() => setShowTutorialModal(false)}
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
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          onReplayTutorial={() => setShowTutorialModal(true)}
        />
      )}

      {/* Cumulative Final Assessment Modal */}
      {showFinalAssessment && (
        <FinalAssessmentModal onClose={() => setShowFinalAssessment(false)} />
      )}

      {/* Out Of Lives & Regeneration Modal */}
      <OutOfLivesModal
        isOpen={showOutOfLivesModal}
        onClose={() => setShowOutOfLivesModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#EADFCF] bg-[#FAF7F2] py-4 px-6 text-center text-xs text-[#7A6B60]">
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
