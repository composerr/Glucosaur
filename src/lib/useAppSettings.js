const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback } from "react";

export default function useAppSettings() {
  const [settings, setSettings] = useState({ language: "en", theme: "light", glucose_unit: "mmol/L", target_glucose_min: 4.0, target_glucose_max: 7.8 });
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await db.entities.UserSettings.list();
      if (list.length > 0) {
        setSettings(list[0]);
        setSettingsId(list[0].id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  const updateSettings = useCallback(async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    if (settingsId) {
      await db.entities.UserSettings.update(settingsId, newSettings);
    } else {
      const created = await db.entities.UserSettings.create(merged);
      setSettingsId(created.id);
    }
  }, [settings, settingsId]);

  return { settings, updateSettings, loading };
}