import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { CharacterCreator } from './components/CharacterCreator';
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
import { CloudDatabaseModal } from './components/CloudDatabaseModal';
import { FinalAssessmentModal } from './components/FinalAssessmentModal';
import { JourneyHub } from './components/JourneyHub';
import { getCityById, getLevelById, ALL_CITIES } from './data/citiesData';
import { PlayerCharacter } from './types';

const GameMain: React.FC = () => {
  const { 
    progress, 
    currentScreen,
    setCurrentScreen,
    activeCityId, 
    setActiveCityId,
    activeLevelId,
    setActiveLevelId,
    activeBossCityId,
    setActiveBossCityId,
    isFestivalOpen,
    setIsFestivalOpen,
    updateProfile,
    updateCharacter,
    completeOnboarding,
    startAsGuest
  } = useGame();

  // Modals state
  const [showNotebook, setShowNotebook] = useState<boolean>(false);
  const [showStudyPlan, setShowStudyPlan] = useState<boolean>(false);
  const [showSyllabus, setShowSyllabus] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showFinalAssessment, setShowFinalAssessment] = useState<boolean>(false);
  const [showCharacterCreatorModal, setShowCharacterCreatorModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);

  // Home view mode: editorial Journey Hub or Spain World Map
  const [homeViewMode, setHomeViewMode] = useState<'journey-hub' | 'world-map'>('journey-hub');

  // City unlock celebration state
  const [unlockedCityInfo, setUnlockedCityInfo] = useState<{
    completedCityName: string;
    nextCityId?: string;
  } | null>(null);

  // Auth screen mode
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const activeCity = activeCityId ? getCityById(activeCityId) : null;
  const activeLevel = (activeCityId && activeLevelId) ? getLevelById(activeCityId, activeLevelId) : null;
  const activeBossCity = activeBossCityId ? getCityById(activeBossCityId) : null;

  /* ========================================================
     SCREEN 1: WELCOME SCREEN
     ======================================================== */
  if (currentScreen === 'welcome') {
    return (
      <WelcomeScreen
        onStartJourney={() => {
          if (progress.profile?.onboardingStep >= 5) {
            setCurrentScreen('world-map');
          } else {
            setCurrentScreen('character-creator');
          }
        }}
        onLogin={() => {
          setAuthMode('login');
          setCurrentScreen('auth');
        }}
        onCreateAccount={() => {
          setAuthMode('register');
          setCurrentScreen('auth');
        }}
        onContinueAsGuest={() => {
          startAsGuest('Viajero');
          setCurrentScreen('character-creator');
        }}
      />
    );
  }

  /* ========================================================
     SCREEN 2: AUTH SCREEN (LOGIN / REGISTER)
     ======================================================== */
  if (currentScreen === 'auth') {
    return (
      <AuthScreen
        mode={authMode}
        onContinueAsGuest={() => {
          startAsGuest('Viajero');
          setCurrentScreen('character-creator');
        }}
        onBack={() => setCurrentScreen('welcome')}
        onSwitchMode={() => setAuthMode(prev => prev === 'login' ? 'register' : 'login')}
        onOpenCloudModal={() => setShowCloudModal(true)}
      />
    );
  }

  /* ========================================================
     SCREEN 3: CHARACTER CREATOR (FULL SCREEN ONBOARDING)
     ======================================================== */
  if (currentScreen === 'character-creator') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <CharacterCreator
          initialCharacter={progress.profile?.character}
          initialName={progress.profile?.displayName}
          onComplete={(char: PlayerCharacter) => {
            updateCharacter(char);
            updateProfile({ displayName: char.name });
            if (progress.profile?.tutorialCompleted) {
              setCurrentScreen('world-map');
            } else {
              setCurrentScreen('tutorial');
            }
          }}
          onBack={() => {
            if (progress.profile?.onboardingStep >= 5) {
              setCurrentScreen('world-map');
            } else {
              setCurrentScreen('welcome');
            }
          }}
        />
      </div>
    );
  }

  /* ========================================================
     SCREEN 4: INTERACTIVE TUTORIAL SCREEN
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
        onOpenCharacterCreator={() => setShowCharacterCreatorModal(true)}
        onOpenCloudModal={() => setShowCloudModal(true)}
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
        ) : homeViewMode === 'world-map' ? (
          <div className="flex flex-col">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2 w-full flex items-center justify-between">
              <button
                onClick={() => setHomeViewMode('journey-hub')}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] border border-[#E0D5C7] text-[#24140E] font-bold text-xs sm:text-sm shadow-xs flex items-center space-x-1.5 transition-all hover:scale-105"
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
              const firstCity = ALL_CITIES[0];
              const unfinished = firstCity.levels.find(l => !progress.completedLevels[l.id]) || firstCity.levels[0];
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
              if (progress.unlockedCityIds.includes(cityId)) {
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
            onOpenCharacterCreator={() => setShowCharacterCreatorModal(true)}
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

      {/* City Unlock Celebration Modal (Screen 13) */}
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

      {/* Character Customization Modal (from Navbar / Settings) */}
      {showCharacterCreatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="my-auto w-full max-w-4xl">
            <CharacterCreator
              initialCharacter={progress.profile?.character}
              initialName={progress.profile?.displayName}
              onComplete={(char: PlayerCharacter) => {
                updateCharacter(char);
                updateProfile({ displayName: char.name });
                setShowCharacterCreatorModal(false);
              }}
              onBack={() => setShowCharacterCreatorModal(false)}
            />
          </div>
        </div>
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
          onOpenCharacterCreator={() => setShowCharacterCreatorModal(true)}
          onReplayTutorial={() => setShowTutorialModal(true)}
          onOpenCloudModal={() => setShowCloudModal(true)}
        />
      )}

      {/* Cloud Remote Database Modal */}
      <CloudDatabaseModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />

      {/* Cumulative Final Assessment Modal */}
      {showFinalAssessment && (
        <FinalAssessmentModal onClose={() => setShowFinalAssessment(false)} />
      )}

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
