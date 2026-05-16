import { useState } from 'react';
import { initialSettings, Settings } from './types';

const useSettings = () => {
  const [settings, setSettingState] = useState<Settings>(initialSettings);

  const setFlashActive = (state: boolean) => {
    setSettingState({ ...settings, flashActivePlayers: state });
  };

  return {
    settings,
    setFlashActive,
  };
};

export default useSettings;
